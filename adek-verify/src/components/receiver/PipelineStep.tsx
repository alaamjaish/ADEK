'use client';

import { useLang } from '@/app/layout';
import ProgressIndicator from '@/components/ui/ProgressIndicator';
import { PipelineStep as PipelineStepType } from '@/lib/data/types';
import { cn } from '@/lib/utils';

interface Props {
  step: PipelineStepType;
  isLast?: boolean;
}

export default function PipelineStep({ step, isLast = false }: Props) {
  const { lang } = useLang();
  const title = lang === 'ar' ? step.titleAr : step.titleEn;

  const duration = step.startTime && step.endTime
    ? ((step.endTime - step.startTime) / 1000).toFixed(1) + 's'
    : null;

  return (
    <div className="relative flex gap-4">
      {/* Connector line */}
      {!isLast && (
        <div className="pipeline-connector" />
      )}

      {/* Status indicator */}
      <div className="flex-shrink-0 z-10">
        <ProgressIndicator status={step.status} />
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 pb-6',
        step.status === 'active' && 'animate-fade-in',
      )}>
        <div className="flex items-center gap-2">
          <h4 className={cn(
            'text-sm font-semibold',
            step.status === 'complete' ? 'text-adek-success' :
            step.status === 'active' ? 'text-adek-navy' :
            step.status === 'error' ? 'text-adek-danger' :
            'text-adek-text-secondary'
          )}>
            {title}
          </h4>
          {duration && (
            <span className="text-xs text-adek-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
              {duration}
            </span>
          )}
        </div>

        {step.details && (
          <p className={cn(
            'text-xs mt-1',
            step.status === 'error' ? 'text-adek-danger' : 'text-adek-text-secondary'
          )}>
            {step.details}
          </p>
        )}

        {step.status === 'active' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-adek-navy animate-pulse-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-adek-navy animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-adek-navy animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
          </div>
        )}
      </div>
    </div>
  );
}
