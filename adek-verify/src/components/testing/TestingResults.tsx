'use client';

import { useLang } from '@/app/layout';
import { TestModelResult } from '@/lib/data/types';
import { TestPhase } from '@/hooks/useTestProcessing';
import { cn } from '@/lib/utils';

interface Props {
  phase1Results: TestModelResult[];
  phase2Results: TestModelResult[];
  currentPhase: TestPhase;
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

function valuesMatch(v1: unknown, v2: unknown): boolean {
  if (v1 === v2) return true;
  const s1 = formatValue(v1);
  const s2 = formatValue(v2);
  return s1 === s2;
}

function PhaseIndicator({ currentPhase, t }: { currentPhase: TestPhase; t: (ar: string, en: string) => string }) {
  const phases = [
    { key: 'phase1' as const, ar: 'المرحلة 1: الاستخراج', en: 'Phase 1: Extraction' },
    { key: 'phase2' as const, ar: 'المرحلة 2: التوافق', en: 'Phase 2: Consensus' },
  ];

  return (
    <div className="flex items-center gap-2 text-xs">
      {phases.map((p, i) => {
        const isActive = currentPhase === p.key;
        const isDone = (p.key === 'phase1' && (currentPhase === 'phase2' || currentPhase === 'done'))
          || (p.key === 'phase2' && currentPhase === 'done');

        return (
          <div key={p.key} className="flex items-center gap-2">
            {i > 0 && (
              <svg className={cn('w-4 h-4', isDone || isActive ? 'text-adek-navy' : 'text-gray-300')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            <span className={cn(
              'px-2.5 py-1 rounded-full font-semibold border',
              isDone && 'bg-green-100 text-green-700 border-green-200',
              isActive && 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse',
              !isDone && !isActive && 'bg-gray-100 text-gray-400 border-gray-200',
            )}>
              {isDone && '\u2713 '}{t(p.ar, p.en)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function TestingResults({ phase1Results, phase2Results, currentPhase }: Props) {
  const { lang, t } = useLang();
  const hasPhase2 = phase2Results.length > 0;

  if (phase1Results.length === 0) {
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

  // Build a lookup: modelId -> phase2 result
  const phase2Map = new Map(phase2Results.map(r => [r.modelId, r]));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-adek-border space-y-3">
        <div>
          <h2 className="text-lg font-bold text-adek-navy">
            {t('مقارنة النتائج', 'Results Comparison')}
          </h2>
          <p className="text-xs text-adek-text-secondary mt-1">
            {t('مقارنة استخراج البيانات بين جميع النماذج', 'Comparing data extraction across all models')}
          </p>
        </div>
        {currentPhase !== 'idle' && (
          <PhaseIndicator currentPhase={currentPhase} t={t} />
        )}
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
              {phase1Results.map((r) => (
                <th key={r.modelId} className="p-3 text-center min-w-[160px]">
                  <div className="space-y-1.5">
                    <div className="font-bold text-adek-navy text-xs">{r.modelName}</div>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Phase 1 status dot */}
                      <span className={cn(
                        'w-2 h-2 rounded-full inline-block',
                        r.status === 'idle' && 'bg-gray-300',
                        r.status === 'running' && 'bg-blue-500 animate-pulse',
                        r.status === 'complete' && 'bg-green-500',
                        r.status === 'error' && 'bg-red-500',
                      )} />
                      {/* Confidence badge (show Phase 2 if available, else Phase 1) */}
                      {(() => {
                        const p2 = phase2Map.get(r.modelId);
                        const conf = (p2?.status === 'complete' ? p2.confidence : r.confidence) || '';
                        return conf ? (
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold border', confidenceColors[conf])}>
                            {conf === 'high' ? t('عالية', 'HIGH') :
                             conf === 'medium' ? t('متوسطة', 'MED') :
                             t('منخفضة', 'LOW')}
                          </span>
                        ) : null;
                      })()}
                      {/* Duration (Phase 1) */}
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
                <td className="p-3 font-medium text-adek-text-secondary text-xs bg-gray-50 border-r border-adek-border/30" rowSpan={hasPhase2 ? 2 : 1}>
                  {lang === 'ar' ? FIELD_LABELS[key].ar : FIELD_LABELS[key].en}
                </td>
                {/* Phase 1 values */}
                {phase1Results.map((r) => {
                  const value = r.extracted_data ? (r.extracted_data as unknown as Record<string, unknown>)[key] : null;
                  const formatted = formatValue(value);
                  const isEmpty = formatted === '-';

                  return (
                    <td key={r.modelId} className="p-2 text-center text-xs">
                      {r.status === 'running' ? (
                        <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        <div>
                          {hasPhase2 && (
                            <span className="text-[9px] text-adek-text-secondary font-medium block mb-0.5">P1</span>
                          )}
                          <span className={cn(
                            isEmpty ? 'text-gray-300 italic' :
                            value === true || value === 'pass' || value === 'clear' ? 'text-green-700 font-semibold' :
                            value === false || value === 'fail' || value === 'blocked' ? 'text-red-600 font-semibold' :
                            'text-adek-text font-medium'
                          )}>
                            {formatted}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )).reduce<React.ReactElement[]>((acc, p1Row, rowIdx) => {
              acc.push(p1Row);
              // Insert Phase 2 sub-row after each Phase 1 row
              if (hasPhase2) {
                const key = FIELD_KEYS[rowIdx];
                acc.push(
                  <tr key={`${key}-p2`} className={cn('border-b border-adek-border/50', rowIdx % 2 === 0 && 'bg-gray-50/50')}>
                    {phase1Results.map((p1r) => {
                      const p2 = phase2Map.get(p1r.modelId);
                      const p1Value = p1r.extracted_data ? (p1r.extracted_data as unknown as Record<string, unknown>)[key] : null;
                      const p2Value = p2?.extracted_data ? (p2.extracted_data as unknown as Record<string, unknown>)[key] : null;
                      const formatted = formatValue(p2Value);
                      const isEmpty = formatted === '-';
                      const changed = p2?.status === 'complete' && !valuesMatch(p1Value, p2Value);

                      return (
                        <td key={p1r.modelId} className={cn('p-2 text-center text-xs', changed && 'bg-amber-50')}>
                          {!p2 ? (
                            <span className="text-gray-200 italic text-[10px]">-</span>
                          ) : p2.status === 'running' ? (
                            <span className="inline-block w-16 h-4 bg-blue-100 rounded animate-pulse" />
                          ) : p2.status === 'error' ? (
                            <span className="text-red-400 text-[10px]">{t('خطأ', 'Error')}</span>
                          ) : (
                            <div>
                              <span className="text-[9px] text-blue-500 font-medium block mb-0.5">P2</span>
                              <span className={cn(
                                isEmpty ? 'text-gray-300 italic' :
                                p2Value === true || p2Value === 'pass' || p2Value === 'clear' ? 'text-green-700 font-semibold' :
                                p2Value === false || p2Value === 'fail' || p2Value === 'blocked' ? 'text-red-600 font-semibold' :
                                'text-adek-text font-medium'
                              )}>
                                {formatted}
                              </span>
                              {changed && (
                                <span className="block text-[9px] text-amber-600 font-semibold mt-0.5">
                                  ({t('تغيّر', 'changed')})
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              }
              return acc;
            }, [])}

            {/* Document dates row */}
            <tr className="border-b border-adek-border/50">
              <td className="p-3 font-medium text-adek-text-secondary text-xs bg-gray-50 border-r border-adek-border/30" rowSpan={hasPhase2 ? 2 : 1}>
                {t('تواريخ المستندات', 'Document Dates')}
              </td>
              {phase1Results.map((r) => {
                const dates = r.extracted_data?.document_dates;
                return (
                  <td key={r.modelId} className="p-2 text-xs">
                    {r.status === 'running' ? (
                      <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      <div>
                        {hasPhase2 && <span className="text-[9px] text-adek-text-secondary font-medium block mb-0.5">P1</span>}
                        {dates && Object.keys(dates).length > 0 ? (
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
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            {hasPhase2 && (
              <tr className="border-b border-adek-border/50">
                {phase1Results.map((p1r) => {
                  const p2 = phase2Map.get(p1r.modelId);
                  const dates = p2?.extracted_data?.document_dates;
                  return (
                    <td key={p1r.modelId} className="p-2 text-xs">
                      {!p2 ? (
                        <span className="text-gray-200 italic text-[10px]">-</span>
                      ) : p2.status === 'running' ? (
                        <span className="inline-block w-16 h-4 bg-blue-100 rounded animate-pulse" />
                      ) : (
                        <div>
                          <span className="text-[9px] text-blue-500 font-medium block mb-0.5">P2</span>
                          {dates && Object.keys(dates).length > 0 ? (
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
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Flags row */}
            <tr className="border-b border-adek-border/50 bg-gray-50/50">
              <td className="p-3 font-medium text-adek-text-secondary text-xs bg-gray-50 border-r border-adek-border/30" rowSpan={hasPhase2 ? 2 : 1}>
                {t('تنبيهات', 'Flags')}
              </td>
              {phase1Results.map((r) => {
                const flags = r.extracted_data?.flags;
                return (
                  <td key={r.modelId} className="p-2 text-xs">
                    {r.status === 'running' ? (
                      <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      <div>
                        {hasPhase2 && <span className="text-[9px] text-adek-text-secondary font-medium block mb-0.5">P1</span>}
                        {flags && flags.length > 0 ? (
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
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            {hasPhase2 && (
              <tr className="border-b border-adek-border/50 bg-gray-50/50">
                {phase1Results.map((p1r) => {
                  const p2 = phase2Map.get(p1r.modelId);
                  const flags = p2?.extracted_data?.flags;
                  return (
                    <td key={p1r.modelId} className="p-2 text-xs">
                      {!p2 ? (
                        <span className="text-gray-200 italic text-[10px]">-</span>
                      ) : p2.status === 'running' ? (
                        <span className="inline-block w-16 h-4 bg-blue-100 rounded animate-pulse" />
                      ) : (
                        <div>
                          <span className="text-[9px] text-blue-500 font-medium block mb-0.5">P2</span>
                          {flags && flags.length > 0 ? (
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
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
