'use client';

import { useLang } from '@/app/layout';
import { JudgeResult } from '@/lib/data/types';
import { getVerdictColor, getVerdictBgColor, getVerdictLabel, getVerdictIcon } from '@/lib/validation/scoring';
import { cn } from '@/lib/utils';

interface Props {
  result: JudgeResult;
}

export default function VerdictDisplay({ result }: Props) {
  const { lang, t } = useLang();

  const verdictColor = getVerdictColor(result.verdict);
  const verdictBg = getVerdictBgColor(result.verdict);
  const verdictLabel = getVerdictLabel(result.verdict, lang);
  const verdictIcon = getVerdictIcon(result.verdict);

  const scoreColor =
    result.score >= 80 ? 'bg-adek-success' :
    result.score >= 50 ? 'bg-adek-warning' :
    'bg-adek-danger';

  return (
    <div className="space-y-4 animate-verdict-pop">
      {/* Main verdict card */}
      <div className={cn('p-4 rounded-xl border-2 text-center', verdictBg)}>
        <div className={cn('text-4xl mb-2', verdictColor)}>{verdictIcon}</div>
        <h3 className={cn('text-2xl font-bold', verdictColor)}>
          {verdictLabel}
        </h3>

        {/* Score bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-adek-text-secondary mb-1">
            <span>{t('النتيجة', 'Score')}</span>
            <span className="font-bold">{result.score}/100</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full score-bar animate-score-fill', scoreColor)}
              style={{ width: `${result.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="p-3 rounded-lg bg-adek-navy/5 border border-adek-navy/10">
        <p className="text-sm font-medium text-adek-navy">
          {lang === 'ar' ? result.recommendation_ar : result.recommendation_en}
        </p>
        <p className="text-xs text-adek-text-secondary mt-1">
          {lang === 'ar' ? result.reasoningAr : result.reasoning}
        </p>
      </div>

      {/* Validation checks */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-adek-navy">
          {t('نتائج التحقق', 'Validation Results')}
        </h4>
        {result.checks.map((check, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between p-2 rounded-lg text-xs',
              check.result === 'pass' ? 'bg-green-50' :
              check.result === 'warning' ? 'bg-yellow-50' :
              'bg-red-50'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={
                check.result === 'pass' ? 'text-adek-success' :
                check.result === 'warning' ? 'text-adek-warning' :
                'text-adek-danger'
              }>
                {check.result === 'pass' ? '\u2713' : check.result === 'warning' ? '\u26A0' : '\u2717'}
              </span>
              <span className="font-medium">
                {lang === 'ar' ? check.ruleAr : check.rule}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-adek-text-secondary">
                {lang === 'ar' ? check.detailsAr : check.details}
              </span>
              <span className={cn(
                'font-bold min-w-[40px] text-end',
                check.points > 0 ? 'text-adek-success' : 'text-adek-danger'
              )}>
                {check.points > 0 ? '+' : ''}{check.points}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Disagreements */}
      {result.disagreements.length > 0 && (
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <h4 className="text-sm font-bold text-adek-warning mb-1">
            {t('نقاط الخلاف بين القراء', 'Reader Disagreements')}
          </h4>
          <ul className="text-xs text-adek-text-secondary space-y-1">
            {result.disagreements.map((d, i) => (
              <li key={i}>- {d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
