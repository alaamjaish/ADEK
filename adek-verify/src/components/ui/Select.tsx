'use client';

import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  labelAr?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelAr?: string;
  lang?: 'ar' | 'en';
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export default function Select({
  label,
  labelAr,
  lang = 'ar',
  options,
  placeholder,
  error,
  className,
  ...props
}: SelectProps) {
  const displayLabel = lang === 'ar' && labelAr ? labelAr : label;

  return (
    <div className="space-y-1">
      {displayLabel && (
        <label className="block text-sm font-medium text-adek-text">
          {displayLabel}
          {props.required && <span className="text-adek-danger mr-1 ml-1">*</span>}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-adek-border bg-white text-adek-text',
          'focus:outline-none focus:ring-2 focus:ring-adek-navy/20 focus:border-adek-navy',
          'transition-colors text-sm appearance-none',
          error && 'border-adek-danger',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {lang === 'ar' && opt.labelAr ? opt.labelAr : opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-adek-danger">{error}</p>}
    </div>
  );
}
