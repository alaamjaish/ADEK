import { ApplicationFormData, DocumentAttachment, ReaderResult } from '../data/types';
import { callOpenRouter, buildImageContent, buildFileContent, buildTextContent } from './openrouter';

/** Strip ```json ... ``` wrappers that some models return despite json_object mode */
function stripMarkdownJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const firstNewline = trimmed.indexOf('\n');
    const lastFence = trimmed.lastIndexOf('```');
    if (lastFence > firstNewline) {
      return trimmed.slice(firstNewline + 1, lastFence).trim();
    }
  }
  return trimmed;
}

function buildFormDataString(form: ApplicationFormData): string {
  // Intentionally omit student name so models extract it independently from documents
  return JSON.stringify({
    student: {
      date_of_birth: form.student.dateOfBirth,
      gender: form.student.gender,
      esis_number: form.student.esisNumber,
      religion: form.student.religion,
    },
    admission: {
      target_school: form.admission.targetSchool,
      target_grade: form.admission.targetGrade,
      target_curriculum: form.admission.targetCurriculum,
    },
    guardian: {
      name: form.guardian.guardianName,
      emirates_id: form.guardian.emiratesIdNumber,
      id_expiry: form.guardian.idExpiryDate,
    },
  }, null, 2);
}

export async function runReader(
  apiKey: string,
  modelId: string,
  modelName: string,
  systemPrompt: string,
  form: ApplicationFormData,
  documents: DocumentAttachment[],
  reasoningEffort?: 'high' | 'medium' | 'low',
): Promise<ReaderResult> {
  try {
    const formDataStr = buildFormDataString(form);
    const prompt = systemPrompt.replace('{{FORM_DATA}}', formDataStr);

    const contentParts = [];
    contentParts.push(buildTextContent('Analyze the following documents for student enrollment verification:'));

    for (const doc of documents) {
      if (!doc.base64 || !doc.mimeType) continue;

      contentParts.push(buildTextContent(`[Document: ${doc.fileName} - Type: ${doc.type}]`));

      if (doc.mimeType === 'application/pdf') {
        // PDFs must use OpenRouter's file content type, not image_url
        contentParts.push(buildFileContent(doc.base64, doc.mimeType, doc.fileName));
      } else {
        contentParts.push(buildImageContent(doc.base64, doc.mimeType));
      }
    }

    contentParts.push(buildTextContent(`\nApplication Form Data:\n${formDataStr}`));

    const response = await callOpenRouter(apiKey, modelId, prompt, contentParts, {
      maxTokens: 4096,
      temperature: 0.1,
      reasoningEffort,
    });

    const parsed = JSON.parse(stripMarkdownJson(response));

    return {
      model: modelId,
      modelName,
      confidence: parsed.confidence || 'medium',
      extracted_data: parsed.extracted_data || {},
      cross_validation: parsed.cross_validation || {},
      raw_response: response,
    };
  } catch (error) {
    return {
      model: modelId,
      modelName,
      confidence: 'low',
      extracted_data: {
        student_name_arabic: '',
        student_name_english: '',
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
        flags: [(error as Error).message],
      },
      cross_validation: {
        name_match: { status: 'mismatch', confidence: 0, details: 'Error during processing' },
        dob_match: { status: 'mismatch', confidence: 0 },
        grade_eligibility: { status: 'ineligible', details: 'Error during processing' },
        transfer_clearance: { status: 'pending' },
        id_verification: { status: 'mismatch' },
      },
      error: (error as Error).message,
    };
  }
}
