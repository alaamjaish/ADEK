'use client';

import { useLang } from '@/app/layout';
import Header from '@/components/layout/Header';
import ApiConfig from '@/components/settings/ApiConfig';
import PromptEditor from '@/components/settings/PromptEditor';
import QuickSettings from '@/components/settings/QuickSettings';
import Button from '@/components/ui/Button';
import { useSettings } from '@/hooks/useSettings';
import Link from 'next/link';

export default function SettingsPage() {
  const { t } = useLang();
  const { settings, updateSettings, resetToDefaults } = useSettings();

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-adek-navy hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t('العودة للرئيسية', 'Back to Main')}
          </Link>
          <h1 className="text-xl font-bold text-adek-navy">
            {t('الإعدادات', 'Settings')}
          </h1>
        </div>

        <ApiConfig
          apiKey={settings.apiKey}
          onApiKeyChange={(apiKey) => updateSettings({ apiKey })}
        />

        <QuickSettings
          models={settings.models}
          humanInLoop={settings.humanInLoop}
          parallelProcessing={settings.parallelProcessing}
          thresholds={settings.thresholds}
          onModelsChange={(models) => updateSettings({ models })}
          onHumanInLoopChange={(humanInLoop) => updateSettings({ humanInLoop })}
          onParallelChange={(parallelProcessing) => updateSettings({ parallelProcessing })}
          onThresholdsChange={(thresholds) => updateSettings({ thresholds })}
        />

        <PromptEditor
          readerPrompt={settings.readerPrompt}
          judgePrompt={settings.judgePrompt}
          onReaderPromptChange={(readerPrompt) => updateSettings({ readerPrompt })}
          onJudgePromptChange={(judgePrompt) => updateSettings({ judgePrompt })}
        />

        <div className="flex justify-center pb-8">
          <Button variant="ghost" onClick={resetToDefaults}>
            {t('إعادة جميع الإعدادات للافتراضي', 'Reset All Settings to Defaults')}
          </Button>
        </div>
      </div>
    </>
  );
}
