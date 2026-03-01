'use client';

import { useState } from 'react';
import { useLang } from '@/app/layout';
import { ReaderResult } from '@/lib/data/types';
import { cn } from '@/lib/utils';

interface Props {
  result: ReaderResult;
  index: number;
}

const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  student_name_arabic: { ar: 'الاسم بالعربي', en: 'Name (Arabic)' },
  student_name_english: { ar: 'الاسم بالإنجليزي', en: 'Name (English)' },
  date_of_birth: { ar: 'تاريخ الميلاد', en: 'Date of Birth' },
  grade_completed: { ar: 'الصف المكتمل', en: 'Grade Completed' },
  pass_fail: { ar: 'نجاح / رسوب', en: 'Pass / Fail' },
  school_name: { ar: 'اسم المدرسة', en: 'School Name' },
  transfer_clearance: { ar: 'حالة الانتقال', en: 'Transfer Clearance' },
  outstanding_obligations: { ar: 'التزامات معلقة', en: 'Outstanding Obligations' },
  emirates_id_number: { ar: 'رقم الهوية', en: 'Emirates ID' },
  has_official_stamp: { ar: 'ختم رسمي', en: 'Official Stamp' },
  has_signature: { ar: 'توقيع', en: 'Signature' },
};

export default function ModelResult({ result, index }: Props) {
  const { lang, t } = useLang();
  const [expanded, setExpanded] = useState(true);

  const confidenceColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800',
  };

  const statusIcon = (status: string) => {
    if (status === 'match' || status === 'eligible' || status === 'clear') return '\u2713';
    if (status === 'partial') return '\u26A0';
    return '\u2717';
  };

  const statusColor = (status: string) => {
    if (status === 'match' || status === 'eligible' || status === 'clear') return 'text-adek-success';
    if (status === 'partial') return 'text-adek-warning';
    return 'text-adek-danger';
  };

  const formatValue = (key: string, value: unknown): string => {
    if (value === true) return '\u2713';
    if (value === false) return '\u2717';
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (result.error) {
    return (
      <div className="p-3 rounded-lg border border-red-200 bg-red-50 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-adek-danger">
            {t('القارئ', 'Reader')} {index + 1}: {result.modelName}
          </span>
          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
            {t('خطأ', 'Error')}
          </span>
        </div>
        <p className="text-xs text-adek-danger">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-adek-border bg-gray-50/50 animate-fade-in overflow-hidden">
      {/* Header - clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-adek-navy">
            {t('القارئ', 'Reader')} {index + 1}: {result.modelName}
          </span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full', confidenceColors[result.confidence])}>
            {result.confidence === 'high' ? t('ثقة عالية', 'High') :
             result.confidence === 'medium' ? t('ثقة متوسطة', 'Medium') :
             t('ثقة منخفضة', 'Low')}
          </span>
        </div>
        <svg
          className={cn('w-4 h-4 text-adek-text-secondary transition-transform', expanded && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Extracted Data - all fields */}
          <div>
            <h5 className="text-xs font-bold text-adek-navy mb-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('البيانات المستخرجة', 'Extracted Data')}
            </h5>
            <div className="rounded-lg border border-adek-border bg-white divide-y divide-adek-border/50">
              {Object.entries(result.extracted_data).map(([key, value]) => {
                if (key === 'document_dates' || key === 'flags') return null;
                const label = FIELD_LABELS[key];
                return (
                  <div key={key} className="flex items-center justify-between px-3 py-1.5 text-xs">
                    <span className="text-adek-text-secondary font-medium">
                      {label ? (lang === 'ar' ? label.ar : label.en) : key}
                    </span>
                    <span className={cn(
                      'font-semibold max-w-[60%] text-end',
                      value === true ? 'text-adek-success' :
                      value === false ? 'text-adek-danger' :
                      value === 'pass' || value === 'clear' ? 'text-adek-success' :
                      value === 'fail' || value === 'blocked' ? 'text-adek-danger' :
                      'text-adek-text'
                    )}>
                      {formatValue(key, value)}
                    </span>
                  </div>
                );
              })}

              {/* Flags */}
              {result.extracted_data.flags && result.extracted_data.flags.length > 0 && (
                <div className="px-3 py-1.5">
                  <span className="text-xs text-adek-text-secondary font-medium">
                    {t('تنبيهات', 'Flags')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {result.extracted_data.flags.map((flag, i) => (
                      <p key={i} className="text-xs text-adek-warning flex items-center gap-1">
                        <span>\u26A0</span> {flag}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cross-validation */}
          <div>
            <h5 className="text-xs font-bold text-adek-navy mb-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('التحقق المتبادل', 'Cross-Validation')}
            </h5>
            <div className="rounded-lg border border-adek-border bg-white divide-y divide-adek-border/50">
              {Object.entries(result.cross_validation).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={statusColor(val.status)}>{statusIcon(val.status)}</span>
                    <span className="text-adek-text-secondary font-medium">
                      {key === 'name_match' ? t('مطابقة الاسم', 'Name Match') :
                       key === 'dob_match' ? t('تاريخ الميلاد', 'DOB Match') :
                       key === 'grade_eligibility' ? t('أهلية الصف', 'Grade Eligibility') :
                       key === 'transfer_clearance' ? t('شهادة الانتقال', 'Transfer Clearance') :
                       t('التحقق من الهوية', 'ID Verification')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 max-w-[55%] text-end">
                    {'confidence' in val && typeof val.confidence === 'number' && (
                      <span className={cn(
                        'text-xs font-bold px-1.5 py-0.5 rounded',
                        val.confidence >= 0.85 ? 'bg-green-100 text-green-800' :
                        val.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {(val.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                    {'details' in val && val.details && (
                      <span className="text-adek-text-secondary truncate">{val.details}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
