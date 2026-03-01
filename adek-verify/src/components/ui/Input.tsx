'use client';

import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelAr?: string;
  lang?: 'ar' | 'en';
  error?: string;
}

export default function Input({
  label,
  labelAr,
  lang = 'ar',
  error,
  className,
  ...props
}: InputProps) {
  const displayLabel = lang === 'ar' && labelAr ? labelAr : label;

  return (
    <div className="space-y-1">
      {displayLabel && (
        <label className="block text-sm font-medium text-adek-text">
          {displayLabel}
          {props.required && <span className="text-adek-danger mr-1 ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-adek-border bg-white text-adek-text',
          'focus:outline-none focus:ring-2 focus:ring-adek-navy/20 focus:border-adek-navy',
          'transition-colors text-sm',
          error && 'border-adek-danger focus:ring-adek-danger/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-adek-danger">{error}</p>}
    </div>
  );
}
