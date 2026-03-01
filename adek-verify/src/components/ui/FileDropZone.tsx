'use client';

import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { cn, formatFileSize } from '@/lib/utils';

interface FileDropZoneProps {
  label: string;
  labelAr?: string;
  lang?: 'ar' | 'en';
  required?: boolean;
  accept?: string;
  maxSize?: number;
  file: { fileName: string; fileSize: number; preview: string } | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export default function FileDropZone({
  label,
  labelAr,
  lang = 'ar',
  required = false,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10 * 1024 * 1024,
  file,
  onFileSelect,
  onRemove,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const displayLabel = lang === 'ar' && labelAr ? labelAr : label;

  const handleFile = useCallback((f: File) => {
    setError('');
    if (f.size > maxSize) {
      setError(lang === 'ar' ? `حجم الملف يتجاوز ${formatFileSize(maxSize)}` : `File exceeds ${formatFileSize(maxSize)}`);
      return;
    }
    onFileSelect(f);
  }, [maxSize, onFileSelect, lang]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  if (file && file.fileName) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-adek-text">
          {displayLabel}
          {required && <span className="text-adek-danger mr-1 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-adek-success/30 bg-green-50 animate-fade-in">
          {file.preview && file.preview.startsWith('data:image') ? (
            <img src={file.preview} alt="" className="w-12 h-12 rounded object-cover border" />
          ) : (
            <div className="w-12 h-12 rounded bg-adek-navy/10 flex items-center justify-center text-adek-navy text-xs font-bold">
              PDF
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.fileName}</p>
            <p className="text-xs text-adek-text-secondary">{formatFileSize(file.fileSize)}</p>
          </div>
          <button
            onClick={onRemove}
            className="p-1 text-adek-danger hover:bg-red-50 rounded transition-colors"
            title={lang === 'ar' ? 'حذف' : 'Remove'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-adek-text">
        {displayLabel}
        {required && <span className="text-adek-danger mr-1 ml-1">*</span>}
      </label>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all',
          'hover:border-adek-navy/40 hover:bg-adek-navy/[0.02]',
          isDragOver ? 'drop-zone-active border-adek-navy bg-adek-navy/5' : 'border-adek-border',
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <svg className="w-8 h-8 mx-auto mb-2 text-adek-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-adek-text-secondary">
          {lang === 'ar' ? 'اسحب الملف هنا أو انقر للاختيار' : 'Drag file here or click to browse'}
        </p>
        <p className="text-xs text-adek-text-secondary mt-1">PDF, JPG, PNG - {formatFileSize(maxSize)}</p>
      </div>
      {error && <p className="text-xs text-adek-danger">{error}</p>}
    </div>
  );
}
