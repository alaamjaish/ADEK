'use client';

import { useLang } from '@/app/layout';
import { ModelConfig } from '@/lib/data/types';

interface Props {
  models: ModelConfig[];
  humanInLoop: boolean;
  parallelProcessing: boolean;
  thresholds: { approve: number; review: number };
  onModelsChange: (models: ModelConfig[]) => void;
  onHumanInLoopChange: (val: boolean) => void;
  onParallelChange: (val: boolean) => void;
  onThresholdsChange: (thresholds: { approve: number; review: number }) => void;
}

export default function QuickSettings({
  models,
  humanInLoop,
  parallelProcessing,
  thresholds,
  onModelsChange,
  onHumanInLoopChange,
  onParallelChange,
  onThresholdsChange,
}: Props) {
  const { t } = useLang();

  const toggleModel = (id: string) => {
    onModelsChange(
      models.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m)
    );
  };

  const setReasoning = (id: string, effort: 'high' | 'medium' | 'low') => {
    onModelsChange(
      models.map(m => m.id === id ? { ...m, reasoningEffort: effort } : m)
    );
  };

  return (
    <div className="space-y-6">
      {/* Model Configuration */}
      <div className="p-4 rounded-xl border border-adek-border">
        <h3 className="text-base font-bold text-adek-navy mb-3">
          {t('إعدادات النماذج', 'Model Configuration')}
        </h3>
        <div className="space-y-3">
          {models.map(model => (
            <div key={model.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={model.enabled}
                    onChange={() => toggleModel(model.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-checked:bg-adek-navy rounded-full peer-focus:ring-2 peer-focus:ring-adek-navy/20 transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
                </label>
                <div>
                  <p className="text-sm font-medium">{model.name}</p>
                  <p className="text-xs text-adek-text-secondary">
                    {model.role === 'judge' ? t('القاضي', 'Judge') : t('قارئ', 'Reader')}
                    {' | '}
                    <span className="font-mono">{model.openrouterId}</span>
                  </p>
                </div>
              </div>
              <select
                value={model.reasoningEffort}
                onChange={(e) => setReasoning(model.id, e.target.value as 'high' | 'medium' | 'low')}
                className="text-xs px-2 py-1 rounded border border-adek-border bg-white"
              >
                <option value="high">{t('عالي', 'High')}</option>
                <option value="medium">{t('متوسط', 'Medium')}</option>
                <option value="low">{t('منخفض', 'Low')}</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Quick toggles */}
      <div className="p-4 rounded-xl border border-adek-border">
        <h3 className="text-base font-bold text-adek-navy mb-3">
          {t('إعدادات سريعة', 'Quick Settings')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('موافقة بشرية مطلوبة', 'Human-in-the-Loop')}</p>
              <p className="text-xs text-adek-text-secondary">
                {t('يجب على المراجع اتخاذ القرار النهائي', 'Reviewer must make the final decision')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={humanInLoop}
                onChange={(e) => onHumanInLoopChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-checked:bg-adek-navy rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('معالجة متوازية', 'Parallel Processing')}</p>
              <p className="text-xs text-adek-text-secondary">
                {t('تشغيل جميع القراء في نفس الوقت', 'Run all readers simultaneously')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parallelProcessing}
                onChange={(e) => onParallelChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-checked:bg-adek-navy rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
            </label>
          </div>
        </div>
      </div>

      {/* Scoring thresholds */}
      <div className="p-4 rounded-xl border border-adek-border">
        <h3 className="text-base font-bold text-adek-navy mb-3">
          {t('حدود التقييم', 'Scoring Thresholds')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="flex justify-between text-sm mb-1">
              <span>{t('حد الموافقة', 'Approve Threshold')}</span>
              <span className="font-bold text-adek-success">{thresholds.approve}</span>
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={thresholds.approve}
              onChange={(e) => onThresholdsChange({ ...thresholds, approve: Number(e.target.value) })}
              className="w-full accent-adek-success"
            />
          </div>
          <div>
            <label className="flex justify-between text-sm mb-1">
              <span>{t('حد المراجعة', 'Review Threshold')}</span>
              <span className="font-bold text-adek-warning">{thresholds.review}</span>
            </label>
            <input
              type="range"
              min="0"
              max={thresholds.approve}
              value={thresholds.review}
              onChange={(e) => onThresholdsChange({ ...thresholds, review: Number(e.target.value) })}
              className="w-full accent-adek-warning"
            />
          </div>
          <div className="flex gap-2 text-xs text-center">
            <div className="flex-1 p-2 rounded bg-red-50 text-adek-danger">
              {t('رفض', 'Reject')}: 0-{thresholds.review - 1}
            </div>
            <div className="flex-1 p-2 rounded bg-yellow-50 text-adek-warning">
              {t('مراجعة', 'Review')}: {thresholds.review}-{thresholds.approve - 1}
            </div>
            <div className="flex-1 p-2 rounded bg-green-50 text-adek-success">
              {t('موافقة', 'Approve')}: {thresholds.approve}+
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
