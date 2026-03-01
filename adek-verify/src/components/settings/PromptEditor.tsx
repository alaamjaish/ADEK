'use client';

import { useLang } from '@/app/layout';
import Button from '@/components/ui/Button';
import { DEFAULT_READER_PROMPT, DEFAULT_JUDGE_PROMPT } from '@/lib/ai/prompts';

interface Props {
  readerPrompt: string;
  judgePrompt: string;
  onReaderPromptChange: (prompt: string) => void;
  onJudgePromptChange: (prompt: string) => void;
}

export default function PromptEditor({
  readerPrompt,
  judgePrompt,
  onReaderPromptChange,
  onJudgePromptChange,
}: Props) {
  const { t } = useLang();

  return (
    <div className="space-y-4 p-4 rounded-xl border border-adek-border">
      <h3 className="text-base font-bold text-adek-navy">
        {t('محرر الأوامر', 'System Prompt Editor')}
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-adek-text mb-1">
            {t('أمر القارئ (مشترك لجميع القراء)', 'Reader Prompt (shared by all readers)')}
          </label>
          <textarea
            value={readerPrompt}
            onChange={(e) => onReaderPromptChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-adek-border text-xs font-mono resize-y h-40 focus:outline-none focus:ring-2 focus:ring-adek-navy/20"
            dir="ltr"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReaderPromptChange(DEFAULT_READER_PROMPT)}
            className="mt-1"
          >
            {t('إعادة للافتراضي', 'Reset to Default')}
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-adek-text mb-1">
            {t('أمر القاضي', 'Judge Prompt')}
          </label>
          <textarea
            value={judgePrompt}
            onChange={(e) => onJudgePromptChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-adek-border text-xs font-mono resize-y h-40 focus:outline-none focus:ring-2 focus:ring-adek-navy/20"
            dir="ltr"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onJudgePromptChange(DEFAULT_JUDGE_PROMPT)}
            className="mt-1"
          >
            {t('إعادة للافتراضي', 'Reset to Default')}
          </Button>
        </div>
      </div>
    </div>
  );
}
