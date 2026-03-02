import { ApplicationFormData, JudgeResult, ReaderResult, ValidationCheck } from '../data/types';
import { getSchoolById } from '../data/schools';
import { callOpenRouter, buildTextContent } from './openrouter';

/** Attempt to repair truncated JSON by closing open strings, arrays, objects */
function repairJson(text: string): string {
  let s = text.trim();
  // Close any unterminated string
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) s += '"';
  // Close open arrays and objects
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

function extractJson(text: string): string {
  const trimmed = text.trim();
  try { JSON.parse(trimmed); return trimmed; } catch {}
  // Strip ```json ... ``` fences (greedy to capture full content between outermost fences)
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]+)\n?\s*```\s*$/);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    try { JSON.parse(inner); return inner; } catch {}
  }
  // Find first { and last } - extract the JSON object
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try { JSON.parse(candidate); return candidate; } catch {}
  }
  // Last resort: try to repair truncated JSON
  if (firstBrace !== -1) {
    const raw = trimmed.slice(firstBrace);
    const repaired = repairJson(raw);
    try { JSON.parse(repaired); return repaired; } catch {}
  }
  return trimmed;
}

function buildSchoolDataString(schoolId: string, grade: string): string {
  const school = getSchoolById(schoolId);
  if (!school) return 'School not found in database';
  const gradeData = school.capacity.find(c => c.grade === grade);
  return JSON.stringify({
    school_name: school.nameEn,
    school_name_ar: school.nameAr,
    curriculum: school.curriculum,
    grade_requested: grade,
    max_capacity: gradeData?.maxCapacity || 30,
    current_male: gradeData?.currentMale || 0,
    current_female: gradeData?.currentFemale || 0,
    available_seats: gradeData ? gradeData.maxCapacity - gradeData.currentMale - gradeData.currentFemale : 0,
  }, null, 2);
}

export async function runJudge(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  form: ApplicationFormData,
  readerResults: ReaderResult[],
): Promise<JudgeResult> {
  try {
    let prompt = systemPrompt;

    const formDataStr = JSON.stringify({
      student: form.student,
      admission: form.admission,
      guardian: {
        name: form.guardian.guardianName,
        emirates_id: form.guardian.emiratesIdNumber,
        id_expiry: form.guardian.idExpiryDate,
      },
    }, null, 2);

    const schoolDataStr = buildSchoolDataString(form.admission.targetSchool, form.admission.targetGrade);

    // Replace reader results
    readerResults.forEach((result, index) => {
      const num = index + 1;
      prompt = prompt.replace(`{{READER${num}_MODEL}}`, result.modelName);
      prompt = prompt.replace(`{{READER${num}_RESULT}}`, JSON.stringify(result, null, 2));
    });

    // Fill remaining reader slots if fewer than 3
    for (let i = readerResults.length + 1; i <= 3; i++) {
      prompt = prompt.replace(`{{READER${i}_MODEL}}`, 'N/A');
      prompt = prompt.replace(`{{READER${i}_RESULT}}`, 'Reader not available');
    }

    prompt = prompt.replace('{{FORM_DATA}}', formDataStr);
    prompt = prompt.replace('{{SCHOOL_DATA}}', schoolDataStr);

    const response = await callOpenRouter(apiKey, modelId, prompt, [buildTextContent('Analyze the reader results and produce your final verdict.')], {
      maxTokens: 16384,
      temperature: 0.1,
    });

    const parsed = JSON.parse(extractJson(response));

    const checks: ValidationCheck[] = (parsed.checks || []).map((c: Record<string, string | number>) => ({
      rule: c.rule || '',
      ruleAr: c.rule_ar || '',
      result: c.result || 'warning',
      severity: c.severity || 'warning',
      details: c.details || '',
      detailsAr: c.details_ar || '',
      points: typeof c.points === 'number' ? c.points : 0,
    }));

    return {
      verdict: parsed.verdict || 'review',
      score: typeof parsed.score === 'number' ? parsed.score : 50,
      reasoning: parsed.reasoning || '',
      reasoningAr: parsed.reasoning_ar || '',
      disagreements: parsed.disagreements || [],
      checks,
      recommendation_ar: parsed.recommendation_ar || '',
      recommendation_en: parsed.recommendation_en || '',
      raw_response: response,
    };
  } catch (error) {
    return {
      verdict: 'review',
      score: 50,
      reasoning: `Error during judge processing: ${(error as Error).message}`,
      reasoningAr: `خطأ أثناء المعالجة: ${(error as Error).message}`,
      disagreements: [],
      checks: [],
      recommendation_ar: 'يحتاج مراجعة يدوية',
      recommendation_en: 'Requires manual review',
      error: (error as Error).message,
    };
  }
}
