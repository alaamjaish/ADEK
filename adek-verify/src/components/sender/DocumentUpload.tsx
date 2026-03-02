'use client';

import { useLang } from '@/app/layout';
import FileDropZone from '@/components/ui/FileDropZone';
import { DocumentAttachment, DOCUMENT_TYPES, DocumentType } from '@/lib/data/types';
import { fileToBase64, fileToDataUrl, getMimeType, generateId } from '@/lib/utils';

interface Props {
  documents: DocumentAttachment[];
  onChange: (documents: DocumentAttachment[]) => void;
  hasEmiratesId: boolean;
}

export default function DocumentUpload({ documents, onChange, hasEmiratesId }: Props) {
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
    onChange(updated);
  };

  const handleRemove = (docType: DocumentType) => {
    onChange(documents.filter(d => d.type !== docType));
  };

  const getDocFile = (docType: DocumentType) => {
    const doc = documents.find(d => d.type === docType);
    if (!doc || !doc.fileName) return null;
    return { fileName: doc.fileName, fileSize: doc.fileSize, preview: doc.preview };
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-adek-navy border-b border-adek-border pb-2">
        {t('المرفقات', 'Document Attachments')}
      </h3>

      <div className="space-y-3">
        {DOCUMENT_TYPES.map((docType) => {
          const hasProof = documents.some(d => d.type === 'proof_no_id' && d.base64);

          // Skip emirates_id entirely if proof_no_id is uploaded
          if (docType.type === 'emirates_id' && hasProof) return null;
          // Hide proof_no_id option if emirates_id is already uploaded
          if (docType.type === 'proof_no_id' && hasEmiratesId) return null;

          const isRequired = docType.type === 'emirates_id'
            ? !hasProof
            : docType.type === 'proof_no_id'
              ? false
              : docType.required;

          return (
            <FileDropZone
              key={docType.type}
              label={docType.labelEn}
              labelAr={docType.labelAr}
              lang={lang}
              required={isRequired}
              file={getDocFile(docType.type)}
              onFileSelect={(file) => handleFileSelect(docType.type, file)}
              onRemove={() => handleRemove(docType.type)}
            />
          );
        })}
      </div>

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
  );
}
