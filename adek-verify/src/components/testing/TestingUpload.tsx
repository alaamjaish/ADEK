'use client';

import { useLang } from '@/app/layout';
import { DocumentAttachment, DocumentType, DOCUMENT_TYPES, TestModelResult } from '@/lib/data/types';
import { fileToBase64, fileToDataUrl, getMimeType, generateId, cn } from '@/lib/utils';
import FileDropZone from '@/components/ui/FileDropZone';
import TestTemplateBar from './TestTemplateBar';
import { TestPhase } from '@/hooks/useTestProcessing';

interface Props {
  documents: DocumentAttachment[];
  onDocumentsChange: (docs: DocumentAttachment[]) => void;
  onRunTest: () => void;
  isProcessing: boolean;
  phase1Results: TestModelResult[];
  phase2Results: TestModelResult[];
  currentPhase: TestPhase;
}

export default function TestingUpload({ documents, onDocumentsChange, onRunTest, isProcessing, phase1Results, phase2Results, currentPhase }: Props) {
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

        {/* Model status badges — Phase 1 */}
        {phase1Results.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-adek-text-secondary uppercase tracking-wider">
              {currentPhase === 'phase1' ? t('المرحلة 1 — جاري...', 'Phase 1 — Running...') : t('المرحلة 1', 'Phase 1')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phase1Results.map((r) => (
                <span
                  key={r.modelId}
                  className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusColors[r.status])}
                >
                  {r.modelName}: {r.status === 'running' ? '...' :
                    r.status === 'complete' ? '\u2713' :
                    r.status === 'error' ? '\u2717' : '-'}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Model status badges — Phase 2 */}
        {phase2Results.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
              {currentPhase === 'phase2' ? t('المرحلة 2 — جاري...', 'Phase 2 — Running...') : t('المرحلة 2', 'Phase 2')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phase2Results.map((r) => (
                <span
                  key={r.modelId}
                  className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusColors[r.status])}
                >
                  {r.modelName}: {r.status === 'running' ? '...' :
                    r.status === 'complete' ? '\u2713' :
                    r.status === 'error' ? '\u2717' : '-'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
