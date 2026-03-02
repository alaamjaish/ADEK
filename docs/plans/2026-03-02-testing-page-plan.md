# Testing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/testing` page that sends raw document files to all 4 AI models (as readers) with zero form context, displaying extraction results side-by-side in a comparison table to evaluate model quality.

**Architecture:** New standalone route `/testing` with its own components. Reuses `callOpenRouter()` from `openrouter.ts` and the `extractJson`/`repairJson` helpers from `reader.ts` (which we'll extract into a shared utility). Left panel has file upload + templates. Right panel has a 4-column comparison table. All 4 models run in parallel as readers with a blind extraction prompt.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, OpenRouter API, localStorage

---

### Task 1: Add types for the testing page

**Files:**
- Modify: `adek-verify/src/lib/data/types.ts`

**Step 1: Add TestTemplate and TestResult types at the bottom of types.ts**

Add these types after the existing `BilingualText` interface (line 217):

```typescript
// --- Testing Page Types ---

export interface TestTemplate {
  id: string;
  name: string;
  createdAt: string;
  documents: Array<{
    type: DocumentType;
    fileName: string;
    fileSize: number;
    base64: string;
    mimeType: string;
    preview: string;
  }>;
}

export interface TestExtractedData {
  student_name_arabic: string;
  student_name_english: string;
  nationality: string;
  date_of_birth: string;
  grade_completed: string;
  pass_fail: string;
  school_name: string;
  transfer_clearance: string;
  outstanding_obligations: string;
  emirates_id_number: string;
  has_official_stamp: boolean;
  has_signature: boolean;
  document_dates: Record<string, string>;
  flags: string[];
}

export type TestModelStatus = 'idle' | 'running' | 'complete' | 'error';

export interface TestModelResult {
  modelId: string;
  modelName: string;
  status: TestModelStatus;
  confidence: 'high' | 'medium' | 'low' | '';
  extracted_data: TestExtractedData | null;
  error?: string;
  raw_response?: string;
  startTime?: number;
  endTime?: number;
}
```

**Step 2: Verify the file saves without TypeScript errors**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to the new types

**Step 3: Commit**

```bash
git add adek-verify/src/lib/data/types.ts
git commit -m "feat: add types for testing page (TestTemplate, TestModelResult)"
```

---

### Task 2: Add test template storage functions

**Files:**
- Modify: `adek-verify/src/lib/storage.ts`

**Step 1: Add the test templates storage key and functions**

In `storage.ts`, add `testTemplates: 'adek-verify-test-templates'` to the `STORAGE_KEYS` object (after line 8).

Then add these functions after the existing `deleteTemplate` function (after line 43):

```typescript
// --- Test Template Functions ---

export interface TestTemplateData {
  id: string;
  name: string;
  createdAt: string;
  documents: Array<{
    type: string;
    fileName: string;
    fileSize: number;
    base64: string;
    mimeType: string;
    preview: string;
  }>;
}

export function loadTestTemplates(): TestTemplateData[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.testTemplates);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTestTemplate(template: TestTemplateData): void {
  if (typeof window === 'undefined') return;
  const templates = loadTestTemplates();
  templates.push(template);
  localStorage.setItem(STORAGE_KEYS.testTemplates, JSON.stringify(templates));
}

export function deleteTestTemplate(id: string): void {
  if (typeof window === 'undefined') return;
  const templates = loadTestTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.testTemplates, JSON.stringify(templates));
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add adek-verify/src/lib/storage.ts
git commit -m "feat: add test template storage functions"
```

---

### Task 3: Create the blind reader function

**Files:**
- Create: `adek-verify/src/lib/ai/test-reader.ts`

**Step 1: Create test-reader.ts**

This is a simplified reader that sends documents with NO form data context. It reuses `callOpenRouter` and content builders from `openrouter.ts`, and duplicates the `extractJson`/`repairJson` logic from `reader.ts` (they're internal to that file).

```typescript
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
      error: (error as Error).message,
      startTime,
      endTime: Date.now(),
    };
  }
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add adek-verify/src/lib/ai/test-reader.ts
git commit -m "feat: add blind test reader function (no form data context)"
```

---

### Task 4: Create the useTestProcessing hook

**Files:**
- Create: `adek-verify/src/hooks/useTestProcessing.ts`

**Step 1: Create the hook**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { DocumentAttachment, TestModelResult, ModelConfig } from '@/lib/data/types';
import { runTestReader } from '@/lib/ai/test-reader';
import { loadSettings } from '@/lib/storage';

export function useTestProcessing() {
  const [results, setResults] = useState<TestModelResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const startTest = useCallback(async (documents: DocumentAttachment[]) => {
    const settings = loadSettings();
    const apiKey = settings.apiKey;

    if (!apiKey) {
      alert('No API key configured. Go to Settings.');
      return;
    }

    const docsWithData = documents.filter(d => d.base64);
    if (docsWithData.length === 0) return;

    setIsProcessing(true);

    // Use all 4 models as readers
    const allModels = settings.models.filter(m => m.enabled);

    // Initialize all results as 'running'
    const initialResults: TestModelResult[] = allModels.map(m => ({
      modelId: m.openrouterId,
      modelName: m.name,
      status: 'running' as const,
      confidence: '' as const,
      extracted_data: null,
      startTime: Date.now(),
    }));
    setResults(initialResults);

    // Run all models in parallel
    const promises = allModels.map((model, index) =>
      runTestReader(apiKey, model.openrouterId, model.name, docsWithData, model.reasoningEffort)
        .then(result => {
          setResults(prev => prev.map((r, i) => i === index ? result : r));
        })
    );

    await Promise.all(promises);
    setIsProcessing(false);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setIsProcessing(false);
  }, []);

  return { results, isProcessing, startTest, reset };
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add adek-verify/src/hooks/useTestProcessing.ts
git commit -m "feat: add useTestProcessing hook for parallel model testing"
```

---

### Task 5: Create the TestTemplateBar component

**Files:**
- Create: `adek-verify/src/components/testing/TestTemplateBar.tsx`

**Step 1: Create TestTemplateBar.tsx**

This is a simpler version of `TemplateBar.tsx` that only stores/restores document arrays (no form data).

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useLang } from '@/app/layout';
import { DocumentAttachment } from '@/lib/data/types';
import { loadTestTemplates, saveTestTemplate, deleteTestTemplate, TestTemplateData } from '@/lib/storage';
import { generateId } from '@/lib/utils';

interface Props {
  documents: DocumentAttachment[];
  onFill: (documents: DocumentAttachment[]) => void;
}

export default function TestTemplateBar({ documents, onFill }: Props) {
  const { t } = useLang();
  const [templates, setTemplates] = useState<TestTemplateData[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    setTemplates(loadTestTemplates());
  }, []);

  const handleFill = () => {
    const template = templates.find(tp => tp.id === selectedId);
    if (!template) return;

    const restoredDocs: DocumentAttachment[] = template.documents.map(doc => ({
      id: generateId(),
      type: doc.type as DocumentAttachment['type'],
      file: null,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      base64: doc.base64,
      mimeType: doc.mimeType,
      preview: doc.preview,
    }));

    onFill(restoredDocs);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;

    const docsForStorage = documents
      .filter(d => d.base64)
      .map(({ file, id, ...rest }) => rest);

    const template: TestTemplateData = {
      id: generateId(),
      name: saveName.trim(),
      createdAt: new Date().toISOString(),
      documents: docsForStorage as TestTemplateData['documents'],
    };

    saveTestTemplate(template);
    setTemplates(loadTestTemplates());
    setSaveName('');
    setShowSaveDialog(false);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    deleteTestTemplate(selectedId);
    setTemplates(loadTestTemplates());
    setSelectedId('');
  };

  return (
    <div className="p-3 bg-adek-navy/5 border border-adek-navy/15 rounded-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <svg className="w-4 h-4 text-adek-navy/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs font-semibold text-adek-navy/70">
            {t('قوالب الاختبار', 'Test Templates')}
          </span>
        </div>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 min-w-[140px] px-2.5 py-1.5 text-sm border border-adek-border rounded-md bg-white text-adek-text focus:outline-none focus:ring-1 focus:ring-adek-navy/20"
        >
          <option value="">{t('— اختر قالب —', '— Select template —')}</option>
          {templates.map((tp) => (
            <option key={tp.id} value={tp.id}>{tp.name}</option>
          ))}
        </select>

        <button
          onClick={handleFill}
          disabled={!selectedId}
          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-adek-gold text-adek-navy hover:bg-adek-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t('تعبئة', 'Fill')}
        </button>

        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={documents.filter(d => d.base64).length === 0}
          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-adek-navy text-white hover:bg-adek-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t('حفظ كقالب', 'Save Template')}
        </button>

        {selectedId && (
          <button
            onClick={handleDelete}
            className="px-2 py-1.5 text-xs rounded-md bg-adek-danger/10 text-adek-danger hover:bg-adek-danger/20 transition-colors"
            title={t('حذف القالب', 'Delete template')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {showSaveDialog && (
        <div className="mt-2 pt-2 border-t border-adek-navy/10 flex items-center gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={t('اسم القالب...', 'Template name...')}
            className="flex-1 px-2.5 py-1.5 text-sm border border-adek-border rounded-md bg-white text-adek-text focus:outline-none focus:ring-1 focus:ring-adek-navy/20"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-adek-success text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('حفظ', 'Save')}
          </button>
          <button
            onClick={() => { setShowSaveDialog(false); setSaveName(''); }}
            className="px-3 py-1.5 text-xs rounded-md bg-gray-100 text-adek-text hover:bg-gray-200 transition-colors"
          >
            {t('إلغاء', 'Cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add adek-verify/src/components/testing/TestTemplateBar.tsx
git commit -m "feat: add TestTemplateBar component for document-only templates"
```

---

### Task 6: Create the TestingUpload component (left panel)

**Files:**
- Create: `adek-verify/src/components/testing/TestingUpload.tsx`

**Step 1: Create TestingUpload.tsx**

This is the left panel - file upload area + template bar + run button + status badges.

```typescript
'use client';

import { useLang } from '@/app/layout';
import { DocumentAttachment, DocumentType, DOCUMENT_TYPES, TestModelResult } from '@/lib/data/types';
import { fileToBase64, fileToDataUrl, getMimeType, generateId, cn } from '@/lib/utils';
import FileDropZone from '@/components/ui/FileDropZone';
import TestTemplateBar from './TestTemplateBar';

interface Props {
  documents: DocumentAttachment[];
  onDocumentsChange: (docs: DocumentAttachment[]) => void;
  onRunTest: () => void;
  isProcessing: boolean;
  results: TestModelResult[];
}

export default function TestingUpload({ documents, onDocumentsChange, onRunTest, isProcessing, results }: Props) {
  const { lang, t } = useLang();

  const handleFileSelect = async (docType: DocumentType, file: File) => {
    const base64 = await fileToBase64(file);
    const preview = file.type.startsWith('image/') ? await fileToDataUrl(file) : '';

    const newDoc: DocumentAttachment = {
      id: generateId(),
      type: docType,
      file,
      fileName: file.name,
      fileSize: file.size,
      base64,
      mimeType: getMimeType(file.name),
      preview,
    };

    const updated = documents.filter(d => d.type !== docType);
    updated.push(newDoc);
    onDocumentsChange(updated);
  };

  const handleRemove = (docType: DocumentType) => {
    onDocumentsChange(documents.filter(d => d.type !== docType));
  };

  const getDocFile = (docType: DocumentType) => {
    const doc = documents.find(d => d.type === docType);
    if (!doc || !doc.fileName) return null;
    return { fileName: doc.fileName, fileSize: doc.fileSize, preview: doc.preview };
  };

  const hasFiles = documents.filter(d => d.base64).length > 0;

  const statusColors: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-500',
    running: 'bg-blue-100 text-blue-700 animate-pulse',
    complete: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-adek-border">
        <h2 className="text-lg font-bold text-adek-navy flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {t('اختبار النماذج', 'Model Testing')}
        </h2>
        <p className="text-xs text-adek-text-secondary mt-1">
          {t(
            'ارفع الملفات واختبر قدرة النماذج على استخراج البيانات بدون أي مدخلات مسبقة',
            'Upload files and test model extraction ability with zero prior input'
          )}
        </p>
      </div>

      {/* Template Bar */}
      <div className="px-4 pt-3">
        <TestTemplateBar documents={documents} onFill={onDocumentsChange} />
      </div>

      {/* File Upload */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {DOCUMENT_TYPES.map((docType) => {
          const hasProof = documents.some(d => d.type === 'proof_no_id' && d.base64);
          const hasEmiratesId = documents.some(d => d.type === 'emirates_id' && d.base64);
          if (docType.type === 'emirates_id' && hasProof) return null;
          if (docType.type === 'proof_no_id' && hasEmiratesId) return null;

          return (
            <FileDropZone
              key={docType.type}
              label={docType.labelEn}
              labelAr={docType.labelAr}
              lang={lang}
              required={false}
              file={getDocFile(docType.type)}
              onFileSelect={(file) => handleFileSelect(docType.type, file)}
              onRemove={() => handleRemove(docType.type)}
            />
          );
        })}

        {/* Upload summary */}
        <div className="p-3 rounded-lg bg-gray-50 border border-adek-border">
          <p className="text-sm text-adek-text-secondary">
            {t(
              `تم رفع ${documents.filter(d => d.base64).length} من ${DOCUMENT_TYPES.length} مستندات`,
              `${documents.filter(d => d.base64).length} of ${DOCUMENT_TYPES.length} documents uploaded`
            )}
          </p>
        </div>
      </div>

      {/* Run Test Button + Status Badges */}
      <div className="p-4 border-t border-adek-border space-y-3">
        <button
          onClick={onRunTest}
          disabled={!hasFiles || isProcessing}
          className={cn(
            'w-full py-3 rounded-lg font-bold text-sm transition-all',
            hasFiles && !isProcessing
              ? 'bg-adek-navy text-white hover:bg-adek-navy-light shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {isProcessing
            ? t('جاري الاختبار...', 'Testing...')
            : t('ابدأ الاختبار', 'Run Test')
          }
        </button>

        {/* Model status badges */}
        {results.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {results.map((r) => (
              <span
                key={r.modelId}
                className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusColors[r.status])}
              >
                {r.modelName}: {r.status === 'running' ? t('جاري...', 'Running...') :
                  r.status === 'complete' ? t('مكتمل', 'Done') :
                  r.status === 'error' ? t('خطأ', 'Error') :
                  t('في الانتظار', 'Idle')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add adek-verify/src/components/testing/TestingUpload.tsx
git commit -m "feat: add TestingUpload component (left panel with file upload)"
```

---

### Task 7: Create the TestingResults component (right panel - comparison table)

**Files:**
- Create: `adek-verify/src/components/testing/TestingResults.tsx`

**Step 1: Create TestingResults.tsx**

This is the 4-column comparison table. Fields as rows, models as columns.

```typescript
'use client';

import { useLang } from '@/app/layout';
import { TestModelResult } from '@/lib/data/types';
import { cn } from '@/lib/utils';

interface Props {
  results: TestModelResult[];
}

const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  student_name_arabic: { ar: 'الاسم بالعربي', en: 'Name (Arabic)' },
  student_name_english: { ar: 'الاسم بالإنجليزي', en: 'Name (English)' },
  nationality: { ar: 'الجنسية', en: 'Nationality' },
  date_of_birth: { ar: 'تاريخ الميلاد', en: 'Date of Birth' },
  grade_completed: { ar: 'الصف المكتمل', en: 'Grade Completed' },
  pass_fail: { ar: 'نجاح / رسوب', en: 'Pass / Fail' },
  school_name: { ar: 'اسم المدرسة', en: 'School Name' },
  transfer_clearance: { ar: 'حالة الانتقال', en: 'Transfer Status' },
  outstanding_obligations: { ar: 'التزامات معلقة', en: 'Obligations' },
  emirates_id_number: { ar: 'رقم الهوية', en: 'Emirates ID' },
  has_official_stamp: { ar: 'ختم رسمي', en: 'Official Stamp' },
  has_signature: { ar: 'توقيع', en: 'Signature' },
};

const FIELD_KEYS = Object.keys(FIELD_LABELS);

const confidenceColors: Record<string, string> = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200',
  '': 'bg-gray-100 text-gray-500 border-gray-200',
};

const statusColors: Record<string, string> = {
  idle: 'text-gray-400',
  running: 'text-blue-500',
  complete: 'text-green-600',
  error: 'text-red-500',
};

function formatValue(value: unknown): string {
  if (value === true) return '\u2713 Yes';
  if (value === false) return '\u2717 No';
  if (value === null || value === undefined || value === '') return '-';
  if (value === 'unknown' || value === 'none') return '-';
  return String(value);
}

function formatDuration(start?: number, end?: number): string {
  if (!start || !end) return '';
  const seconds = ((end - start) / 1000).toFixed(1);
  return `${seconds}s`;
}

export default function TestingResults({ results }: Props) {
  const { lang, t } = useLang();

  if (results.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-adek-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-bold text-adek-navy/40 mb-1">
            {t('لا توجد نتائج بعد', 'No Results Yet')}
          </h3>
          <p className="text-sm text-adek-text-secondary">
            {t('ارفع الملفات واضغط "ابدأ الاختبار" لرؤية النتائج', 'Upload files and click "Run Test" to see results')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-adek-border">
        <h2 className="text-lg font-bold text-adek-navy">
          {t('مقارنة النتائج', 'Results Comparison')}
        </h2>
        <p className="text-xs text-adek-text-secondary mt-1">
          {t('مقارنة استخراج البيانات بين جميع النماذج', 'Comparing data extraction across all models')}
        </p>
      </div>

      {/* Comparison Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          {/* Model headers */}
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b-2 border-adek-navy/20">
              <th className="text-start p-3 font-bold text-adek-navy bg-gray-50 min-w-[140px]">
                {t('الحقل', 'Field')}
              </th>
              {results.map((r) => (
                <th key={r.modelId} className="p-3 text-center min-w-[160px]">
                  <div className="space-y-1.5">
                    <div className="font-bold text-adek-navy text-xs">{r.modelName}</div>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Status dot */}
                      <span className={cn('w-2 h-2 rounded-full inline-block', {
                        'bg-gray-300': r.status === 'idle',
                        'bg-blue-500 animate-pulse': r.status === 'running',
                        'bg-green-500': r.status === 'complete',
                        'bg-red-500': r.status === 'error',
                      })} />
                      {/* Confidence badge */}
                      {r.confidence && (
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold border', confidenceColors[r.confidence])}>
                          {r.confidence === 'high' ? t('عالية', 'HIGH') :
                           r.confidence === 'medium' ? t('متوسطة', 'MED') :
                           t('منخفضة', 'LOW')}
                        </span>
                      )}
                      {/* Duration */}
                      {r.startTime && r.endTime && (
                        <span className="text-[10px] text-adek-text-secondary">
                          {formatDuration(r.startTime, r.endTime)}
                        </span>
                      )}
                    </div>
                    {r.error && (
                      <div className="text-[10px] text-red-500 truncate max-w-[150px]" title={r.error}>
                        {r.error.substring(0, 40)}...
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {FIELD_KEYS.map((key, rowIdx) => (
              <tr key={key} className={cn('border-b border-adek-border/50', rowIdx % 2 === 0 && 'bg-gray-50/50')}>
                <td className="p-3 font-medium text-adek-text-secondary text-xs bg-gray-50 border-r border-adek-border/30">
                  {lang === 'ar' ? FIELD_LABELS[key].ar : FIELD_LABELS[key].en}
                </td>
                {results.map((r) => {
                  const value = r.extracted_data ? (r.extracted_data as Record<string, unknown>)[key] : null;
                  const formatted = formatValue(value);
                  const isEmpty = formatted === '-';

                  return (
                    <td key={r.modelId} className="p-3 text-center text-xs">
                      {r.status === 'running' ? (
                        <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        <span className={cn(
                          isEmpty ? 'text-gray-300 italic' :
                          value === true || value === 'pass' || value === 'clear' ? 'text-green-700 font-semibold' :
                          value === false || value === 'fail' || value === 'blocked' ? 'text-red-600 font-semibold' :
                          'text-adek-text font-medium'
                        )}>
                          {formatted}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Document dates row */}
            <tr className="border-b border-adek-border/50">
              <td className="p-3 font-medium text-adek-text-secondary text-xs bg-gray-50 border-r border-adek-border/30">
                {t('تواريخ المستندات', 'Document Dates')}
              </td>
              {results.map((r) => {
                const dates = r.extracted_data?.document_dates;
                return (
                  <td key={r.modelId} className="p-3 text-xs">
                    {r.status === 'running' ? (
                      <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
                    ) : dates && Object.keys(dates).length > 0 ? (
                      <div className="space-y-0.5 text-start">
                        {Object.entries(dates).map(([doc, date]) => (
                          <div key={doc} className="text-adek-text">
                            <span className="text-adek-text-secondary">{doc}:</span> {date}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-300 italic">-</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Flags row */}
            <tr className="border-b border-adek-border/50 bg-gray-50/50">
              <td className="p-3 font-medium text-adek-text-secondary text-xs bg-gray-50 border-r border-adek-border/30">
                {t('تنبيهات', 'Flags')}
              </td>
              {results.map((r) => {
                const flags = r.extracted_data?.flags;
                return (
                  <td key={r.modelId} className="p-3 text-xs">
                    {r.status === 'running' ? (
                      <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
                    ) : flags && flags.length > 0 ? (
                      <div className="space-y-0.5 text-start">
                        {flags.map((flag, i) => (
                          <div key={i} className="text-amber-600 flex items-start gap-1">
                            <span className="shrink-0">{'\u26A0'}</span>
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-300 italic">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add adek-verify/src/components/testing/TestingResults.tsx
git commit -m "feat: add TestingResults comparison table component"
```

---

### Task 8: Create the testing page route

**Files:**
- Create: `adek-verify/src/app/testing/page.tsx`

**Step 1: Create the testing page**

```typescript
'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import TestingUpload from '@/components/testing/TestingUpload';
import TestingResults from '@/components/testing/TestingResults';
import { DocumentAttachment } from '@/lib/data/types';
import { useTestProcessing } from '@/hooks/useTestProcessing';

export default function TestingPage() {
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const { results, isProcessing, startTest, reset } = useTestProcessing();

  const handleRunTest = () => {
    startTest(documents);
  };

  return (
    <>
      <Header />
      <div className="max-w-[1800px] mx-auto p-4 flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left panel - Upload (narrower) */}
        <div className="w-full lg:w-[30%] order-1 lg:order-none">
          <div className="bg-white rounded-xl shadow-sm border border-adek-border h-full overflow-auto">
            <TestingUpload
              documents={documents}
              onDocumentsChange={setDocuments}
              onRunTest={handleRunTest}
              isProcessing={isProcessing}
              results={results}
            />
          </div>
        </div>

        {/* Right panel - Results (wider) */}
        <div className="w-full lg:w-[70%] order-2 lg:order-none">
          <div className="bg-white rounded-xl shadow-sm border border-adek-border h-full overflow-auto">
            <TestingResults results={results} />
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add adek-verify/src/app/testing/page.tsx
git commit -m "feat: add /testing route page"
```

---

### Task 9: Add Testing link to Header navigation

**Files:**
- Modify: `adek-verify/src/components/layout/Header.tsx`

**Step 1: Add the Testing nav link**

In `Header.tsx`, add a Testing link before the Settings link (before line 38). Insert this between the language toggle button and the Settings Link:

```typescript
          {/* Testing Link */}
          <Link
            href="/testing"
            className="px-3 py-1.5 text-sm rounded-md border border-adek-gold/30 text-adek-gold hover:bg-adek-gold/10 transition-colors"
            title={t('اختبار النماذج', 'Model Testing')}
          >
            {t('اختبار', 'Testing')}
          </Link>
```

Also add a "Home" link before the Testing link so users can navigate back:

```typescript
          {/* Home Link */}
          <Link
            href="/"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-white/10 transition-colors"
          >
            {t('الرئيسية', 'Home')}
          </Link>
```

**Step 2: Verify the header renders correctly**

Run: `cd adek-verify && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add adek-verify/src/components/layout/Header.tsx
git commit -m "feat: add Home and Testing navigation links to header"
```

---

### Task 10: Verify the full app builds and works

**Step 1: Run a full build**

Run: `cd adek-verify && npm run build 2>&1 | tail -30`
Expected: Build succeeds, `/testing` route listed in output

**Step 2: Fix any build errors**

If there are errors, fix them one at a time.

**Step 3: Final commit with all fixes**

```bash
git add -A
git commit -m "feat: complete testing page for model extraction quality testing"
```
