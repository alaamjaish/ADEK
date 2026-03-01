'use client';

import { useLang } from '@/app/layout';
import PipelineStepComponent from './PipelineStep';
import ModelResult from './ModelResult';
import VerdictDisplay from './VerdictDisplay';
import HumanDecision from './HumanDecision';
import {
  PipelineStep,
  ReaderResult,
  JudgeResult,
  HumanDecision as HumanDecisionType,
} from '@/lib/data/types';

interface Props {
  steps: PipelineStep[];
  readerResults: ReaderResult[];
  judgeResult: JudgeResult | null;
  humanDecision: HumanDecisionType | null;
  humanInLoop: boolean;
  onHumanDecision: (decision: HumanDecisionType, notes: string) => void;
  onReset: () => void;
}

export default function ProcessingPipeline({
  steps,
  readerResults,
  judgeResult,
  humanDecision,
  humanInLoop,
  onHumanDecision,
  onReset,
}: Props) {
  const { t } = useLang();

  const isIdle = steps.every(s => s.status === 'pending');
  const isComplete = judgeResult !== null;

  return (
    <div className="p-6">
      {/* Panel header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-adek-navy/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-adek-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-adek-navy">
              {t('المتلقي (أديك)', 'Receiver (ADEK)')}
            </h2>
            <p className="text-xs text-adek-text-secondary">
              {t('مسار التحقق الذكي - مجلس الحكماء', 'Smart Verification Pipeline - Council of Wise Men')}
            </p>
          </div>
        </div>

        {isComplete && (
          <button
            onClick={onReset}
            className="text-xs text-adek-navy hover:underline"
          >
            {t('طلب جديد', 'New Application')}
          </button>
        )}
      </div>

      {/* Idle state */}
      {isIdle && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-adek-navy/5 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-adek-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-adek-text-secondary mb-1">
            {t('في انتظار الطلب', 'Awaiting Application')}
          </h3>
          <p className="text-sm text-adek-text-secondary/70">
            {t(
              'أرسل طلب التسجيل من اللوحة المجاورة لبدء التحقق الذكي',
              'Submit an enrollment application from the adjacent panel to start smart verification'
            )}
          </p>
        </div>
      )}

      {/* Pipeline steps */}
      {!isIdle && (
        <div className="space-y-0">
          {steps.map((step, i) => (
            <PipelineStepComponent
              key={step.id}
              step={step}
              isLast={i === steps.length - 1 && !isComplete}
            />
          ))}
        </div>
      )}

      {/* Reader results */}
      {readerResults.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-bold text-adek-navy mb-2">
            {t('نتائج القراء', 'Reader Results')}
          </h4>
          {readerResults.map((result, i) => (
            <ModelResult key={result.model} result={result} index={i} />
          ))}
        </div>
      )}

      {/* Judge verdict */}
      {judgeResult && (
        <div className="mt-4">
          <VerdictDisplay result={judgeResult} />
        </div>
      )}

      {/* Human decision */}
      {judgeResult && humanInLoop && !humanDecision && (
        <div className="mt-4">
          <HumanDecision onDecision={onHumanDecision} />
        </div>
      )}

      {/* Final decision display */}
      {humanDecision && (
        <div className="mt-4 p-4 rounded-xl border-2 border-adek-navy bg-adek-navy/5 animate-fade-in text-center">
          <p className="text-sm font-bold text-adek-navy">
            {t('القرار النهائي:', 'Final Decision:')}
          </p>
          <p className="text-xl font-bold mt-1" style={{
            color: humanDecision === 'accept' ? '#2D8A4E' :
                   humanDecision === 'reject' ? '#C0392B' : '#D4A017'
          }}>
            {humanDecision === 'accept' ? t('مقبول', 'ACCEPTED') :
             humanDecision === 'reject' ? t('مرفوض', 'REJECTED') :
             t('معاد للمدرسة', 'RETURNED')}
          </p>
        </div>
      )}
    </div>
  );
}
