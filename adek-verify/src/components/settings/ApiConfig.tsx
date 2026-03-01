'use client';

import { useState } from 'react';
import { useLang } from '@/app/layout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { testConnection } from '@/lib/ai/openrouter';

interface Props {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export default function ApiConfig({ apiKey, onApiKeyChange }: Props) {
  const { t } = useLang();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(apiKey);
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="space-y-4 p-4 rounded-xl border border-adek-border">
      <h3 className="text-base font-bold text-adek-navy">
        {t('إعدادات API', 'API Configuration')}
      </h3>

      <div className="space-y-3">
        <Input
          label="OpenRouter API Key"
          labelAr="مفتاح OpenRouter API"
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="sk-or-..."
          dir="ltr"
        />

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTest}
            disabled={!apiKey || testing}
          >
            {testing ? (
              <>
                <span className="w-3 h-3 border-2 border-adek-navy/30 border-t-adek-navy rounded-full animate-spin-slow" />
                {t('جاري الاختبار...', 'Testing...')}
              </>
            ) : (
              t('اختبار الاتصال', 'Test Connection')
            )}
          </Button>

          {testResult && (
            <span className={`text-sm ${testResult.success ? 'text-adek-success' : 'text-adek-danger'}`}>
              {testResult.success
                ? t('متصل بنجاح', 'Connected successfully')
                : `${t('فشل الاتصال:', 'Connection failed:')} ${testResult.error}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
