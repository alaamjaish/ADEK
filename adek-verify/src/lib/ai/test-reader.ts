import { DocumentAttachment, TestModelResult, TestExtractedData } from '../data/types';
import { callOpenRouter, buildImageContent, buildFileContent, buildTextContent } from './openrouter';

const TEST_EXTRACTION_PROMPT = `You are a document analysis expert specializing in educational and identity documents from the UAE (United Arab Emirates).

Extract the following fields from the provided documents. You must extract ONLY what you find - do not guess or fabricate data.

Return a valid JSON object with these exact keys:
{
  "confidence": "high" | "medium" | "low",
  "extracted_data": {
    "student_name_arabic": "Arabic name exactly as written, or empty string",
    "student_name_english": "English name exactly as written, or empty string",
    "nationality": "nationality found in documents, or empty string",
    "date_of_birth": "YYYY-MM-DD format, or empty string",
    "grade_completed": "e.g. Grade 9, or empty string",
    "pass_fail": "pass or fail or unknown",
    "school_name": "name of the school, or empty string",
    "transfer_clearance": "clear or pending or blocked",
    "outstanding_obligations": "description of any obligations, or none",
    "emirates_id_number": "784-XXXX-XXXXXXX-X format, or empty string",
    "has_official_stamp": true or false,
    "has_signature": true or false,
    "document_dates": { "document_name": "date found" },
    "flags": ["any concerns, anomalies, or quality issues"]
  }
}

Important:
- Read ALL documents carefully, including Arabic text
- Extract the EXACT text as it appears in documents
- For names, preserve the full name including all parts
- For dates, convert to YYYY-MM-DD format
- Note any discrepancies between documents in the flags array
- You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;

/** Attempt to repair truncated JSON by closing open strings, arrays, objects */
function repairJson(text: string): string {
  let s = text.trim();
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) s += '"';
  const opens: string[] = [];
  let inString = false;
  let escape = false;
  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') opens.push(ch);
    if (ch === '}' || ch === ']') opens.pop();
  }
  while (opens.length > 0) {
    const open = opens.pop();
    s += open === '{' ? '}' : ']';
  }
  return s;
}

/** Extract valid JSON from model response */
function extractJson(text: string): string {
  const trimmed = text.trim();
  try { JSON.parse(trimmed); return trimmed; } catch {}

  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]+)\n?\s*```\s*$/);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    try { JSON.parse(inner); return inner; } catch {}
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try { JSON.parse(candidate); return candidate; } catch {}
  }

  if (firstBrace !== -1) {
    const raw = trimmed.slice(firstBrace);
    const repaired = repairJson(raw);
    try { JSON.parse(repaired); return repaired; } catch {}
  }

  return trimmed;
}

const EMPTY_EXTRACTED: TestExtractedData = {
  student_name_arabic: '',
  student_name_english: '',
  nationality: '',
  date_of_birth: '',
  grade_completed: '',
  pass_fail: 'unknown',
  school_name: '',
  transfer_clearance: 'pending',
  outstanding_obligations: '',
  emirates_id_number: '',
  has_official_stamp: false,
  has_signature: false,
  document_dates: {},
  flags: [],
};

export async function runTestReader(
  apiKey: string,
  modelId: string,
  modelName: string,
  documents: DocumentAttachment[],
  reasoningEffort?: 'high' | 'medium' | 'low',
): Promise<TestModelResult> {
  const startTime = Date.now();

  try {
    const contentParts = [];
    contentParts.push(buildTextContent('Analyze the following documents and extract all student data:'));

    for (const doc of documents) {
      if (!doc.base64 || !doc.mimeType) continue;

      contentParts.push(buildTextContent(`[Document: ${doc.fileName} - Type: ${doc.type}]`));

      if (doc.mimeType === 'application/pdf') {
        contentParts.push(buildFileContent(doc.base64, doc.mimeType, doc.fileName));
      } else {
        contentParts.push(buildImageContent(doc.base64, doc.mimeType));
      }
    }

    const response = await callOpenRouter(apiKey, modelId, TEST_EXTRACTION_PROMPT, contentParts, {
      maxTokens: 16384,
      temperature: 0.1,
      reasoningEffort,
    });

    const parsed = JSON.parse(extractJson(response));

    return {
      modelId,
      modelName,
      status: 'complete',
      confidence: parsed.confidence || 'medium',
      extracted_data: { ...EMPTY_EXTRACTED, ...parsed.extracted_data },
      phase: 1 as const,
      raw_response: response,
      startTime,
      endTime: Date.now(),
    };
  } catch (error) {
    return {
      modelId,
      modelName,
      status: 'error',
      confidence: '',
      extracted_data: { ...EMPTY_EXTRACTED, flags: [(error as Error).message] },
      phase: 1 as const,
      error: (error as Error).message,
      startTime,
      endTime: Date.now(),
    };
  }
}

const CONSENSUS_PROMPT = `You are a document analysis expert. This is a CONSENSUS ROUND (Phase 2).

In Phase 1, you and 3 other AI models independently extracted data from the same documents. Now you must:
1. Re-read ALL the original documents carefully (they are attached again)
2. Review your own Phase 1 extraction and the other models' extractions
3. Produce your FINAL confirmed extraction

If you see something another model found that you missed, verify it against the documents and include it if correct.
If you see disagreements between models, re-read the relevant document and go with what the document actually says.
If your Phase 1 answer was correct, keep it. Only change values you are now MORE confident about.

YOUR Phase 1 result:
{OWN_RESULT}

OTHER models' Phase 1 results:
{OTHER_RESULTS}

Now re-read the attached documents and return your FINAL extraction.
Return a valid JSON object with these exact keys:
{
  "confidence": "high" | "medium" | "low",
  "extracted_data": {
    "student_name_arabic": "Arabic name exactly as written, or empty string",
    "student_name_english": "English name exactly as written, or empty string",
    "nationality": "nationality found in documents, or empty string",
    "date_of_birth": "YYYY-MM-DD format, or empty string",
    "grade_completed": "e.g. Grade 9, or empty string",
    "pass_fail": "pass or fail or unknown",
    "school_name": "name of the school, or empty string",
    "transfer_clearance": "clear or pending or blocked",
    "outstanding_obligations": "description of any obligations, or none",
    "emirates_id_number": "784-XXXX-XXXXXXX-X format, or empty string",
    "has_official_stamp": true or false,
    "has_signature": true or false,
    "document_dates": { "document_name": "date found" },
    "flags": ["any concerns, anomalies, or quality issues"]
  }
}

Important:
- Re-read ALL documents carefully, including Arabic text
- Extract the EXACT text as it appears in documents
- You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;

export async function runTestConsensusReader(
  apiKey: string,
  modelId: string,
  modelName: string,
  documents: DocumentAttachment[],
  ownPhase1: TestModelResult,
  otherPhase1Results: TestModelResult[],
  reasoningEffort?: 'high' | 'medium' | 'low',
): Promise<TestModelResult> {
  const startTime = Date.now();

  try {
    const ownResultJson = JSON.stringify(ownPhase1.extracted_data, null, 2);
    const othersJson = otherPhase1Results
      .map(r => `[${r.modelName}] (confidence: ${r.confidence}):\n${JSON.stringify(r.extracted_data, null, 2)}`)
      .join('\n\n');

    const prompt = CONSENSUS_PROMPT
      .replace('{OWN_RESULT}', ownResultJson)
      .replace('{OTHER_RESULTS}', othersJson);

    const contentParts = [];
    contentParts.push(buildTextContent('Re-read the following documents for the consensus round:'));

    for (const doc of documents) {
      if (!doc.base64 || !doc.mimeType) continue;
      contentParts.push(buildTextContent(`[Document: ${doc.fileName} - Type: ${doc.type}]`));
      if (doc.mimeType === 'application/pdf') {
        contentParts.push(buildFileContent(doc.base64, doc.mimeType, doc.fileName));
      } else {
        contentParts.push(buildImageContent(doc.base64, doc.mimeType));
      }
    }

    const response = await callOpenRouter(apiKey, modelId, prompt, contentParts, {
      maxTokens: 16384,
      temperature: 0.1,
      reasoningEffort,
    });

    const parsed = JSON.parse(extractJson(response));

    return {
      modelId,
      modelName,
      status: 'complete',
      confidence: parsed.confidence || 'medium',
      extracted_data: { ...EMPTY_EXTRACTED, ...parsed.extracted_data },
      phase: 2 as const,
      raw_response: response,
      startTime,
      endTime: Date.now(),
    };
  } catch (error) {
    return {
      modelId,
      modelName,
      status: 'error',
      confidence: '',
      extracted_data: { ...EMPTY_EXTRACTED, flags: [(error as Error).message] },
      phase: 2 as const,
      error: (error as Error).message,
      startTime,
      endTime: Date.now(),
    };
  }
}
