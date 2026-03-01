'use client';

import { useState } from 'react';
import { useLang } from '@/app/layout';
import Button from '@/components/ui/Button';
import { HumanDecision as HumanDecisionType } from '@/lib/data/types';

interface Props {
  onDecision: (decision: HumanDecisionType, notes: string) => void;
}

export default function HumanDecision({ onDecision }: Props) {
  const { t } = useLang();
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-3 p-4 rounded-xl border-2 border-adek-gold bg-adek-gold/5 animate-fade-in">
      <h4 className="text-sm font-bold text-adek-navy flex items-center gap-2">
        <svg className="w-4 h-4 text-adek-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {t('القرار النهائي - ولي الأمر الإداري', 'Final Decision - Human Authority')}
      </h4>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('ملاحظات إضافية (اختياري)', 'Additional notes (optional)')}
        className="w-full px-3 py-2 rounded-lg border border-adek-border text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-adek-navy/20"
      />

      <div className="flex gap-2">
        <Button
          variant="success"
          size="md"
          onClick={() => onDecision('accept', notes)}
          className="flex-1"
        >
          {t('قبول', 'Accept')}
        </Button>
        <Button
          variant="danger"
          size="md"
          onClick={() => onDecision('reject', notes)}
          className="flex-1"
        >
          {t('رفض', 'Reject')}
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => onDecision('return', notes)}
          className="flex-1"
        >
          {t('إعادة', 'Return')}
        </Button>
      </div>
    </div>
  );
}
