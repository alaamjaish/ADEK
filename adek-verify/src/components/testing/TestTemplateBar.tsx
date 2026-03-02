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
