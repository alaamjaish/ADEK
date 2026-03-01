'use client';

import { cn } from '@/lib/utils';
import { PipelineStepStatus } from '@/lib/data/types';

interface ProgressIndicatorProps {
  status: PipelineStepStatus;
  size?: 'sm' | 'md';
}

export default function ProgressIndicator({ status, size = 'md' }: ProgressIndicatorProps) {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';

  if (status === 'complete') {
    return (
      <div className={cn(sizeClass, 'rounded-full bg-adek-success flex items-center justify-center animate-fade-in')}>
        <svg className={cn(iconSize, 'text-white')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className={cn(sizeClass, 'rounded-full border-3 border-adek-navy border-t-transparent animate-spin-slow')} />
    );
  }

  if (status === 'error') {
    return (
      <div className={cn(sizeClass, 'rounded-full bg-adek-danger flex items-center justify-center')}>
        <svg className={cn(iconSize, 'text-white')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  // pending
  return (
    <div className={cn(sizeClass, 'rounded-full border-2 border-adek-border flex items-center justify-center')}>
      <div className="w-2 h-2 rounded-full bg-adek-border" />
    </div>
  );
}
