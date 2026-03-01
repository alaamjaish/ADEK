'use client';

import { useState, useCallback } from 'react';
import {
  ApplicationFormData,
  PipelineStep,
  ReaderResult,
  JudgeResult,
  HumanDecision,
  AppSettings,
} from '@/lib/data/types';
import { runReader } from '@/lib/ai/reader';
import { runJudge } from '@/lib/ai/judge';

const INITIAL_STEPS: PipelineStep[] = [
  { id: 'receive', titleAr: 'استلام الطلب', titleEn: 'Receiving Application', status: 'pending' },
  { id: 'read-docs', titleAr: 'قراءة المستندات', titleEn: 'Reading Documents', status: 'pending' },
  { id: 'reader-1', titleAr: 'القارئ 1 - Gemini 3 Flash', titleEn: 'AI Reader 1 - Gemini 3 Flash', status: 'pending' },
  { id: 'reader-2', titleAr: 'القارئ 2 - Gemini 3.1 Pro', titleEn: 'AI Reader 2 - Gemini 3.1 Pro', status: 'pending' },
  { id: 'reader-3', titleAr: 'القارئ 3 - GPT-5.2', titleEn: 'AI Reader 3 - GPT-5.2', status: 'pending' },
  { id: 'judge', titleAr: 'القاضي - Gemini 3.1 Pro', titleEn: 'AI Judge - Gemini 3.1 Pro', status: 'pending' },
  { id: 'verdict', titleAr: 'الحكم النهائي', titleEn: 'Final Verdict', status: 'pending' },
];

export function useAIProcessing() {
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [readerResults, setReaderResults] = useState<ReaderResult[]>([]);
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [humanDecision, setHumanDecision] = useState<HumanDecision | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateStep = useCallback((id: string, update: Partial<PipelineStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  }, []);

  const startProcessing = useCallback(async (form: ApplicationFormData, settings: AppSettings) => {
    setIsProcessing(true);
    setReaderResults([]);
    setJudgeResult(null);
    setHumanDecision(null);
    setSteps(INITIAL_STEPS);

    const apiKey = settings.apiKey;
    if (!apiKey) {
      updateStep('receive', { status: 'error', details: 'No API key configured. Go to Settings.' });
      setIsProcessing(false);
      return;
    }

    // Step 1: Receive
    updateStep('receive', {
      status: 'active',
      startTime: Date.now(),
      details: `Application ${form.student.applicationNumber}`,
    });
    await delay(800);
    updateStep('receive', {
      status: 'complete',
      endTime: Date.now(),
      details: `Application ${form.student.applicationNumber} received`,
    });

    // Step 2: Read docs
    updateStep('read-docs', { status: 'active', startTime: Date.now() });
    const docsWithData = form.documents.filter(d => d.base64);
    await delay(600);
    updateStep('read-docs', {
      status: 'complete',
      endTime: Date.now(),
      details: `${docsWithData.length} documents loaded`,
    });

    // Steps 3-5: Readers (parallel or sequential)
    const readerModels = settings.models.filter(m => m.role === 'reader' && m.enabled);
    const readerStepIds = ['reader-1', 'reader-2', 'reader-3'];

    // Update step names based on actual models
    readerModels.forEach((model, i) => {
      if (readerStepIds[i]) {
        updateStep(readerStepIds[i], {
          titleEn: `AI Reader ${i + 1} - ${model.name}`,
          titleAr: `القارئ ${i + 1} - ${model.name}`,
        });
      }
    });

    const results: ReaderResult[] = [];

    if (settings.parallelProcessing) {
      // Mark all readers as active
      readerModels.forEach((_, i) => {
        if (readerStepIds[i]) {
          updateStep(readerStepIds[i], { status: 'active', startTime: Date.now() });
        }
      });

      // Run all in parallel
      const promises = readerModels.map((model, i) =>
        runReader(apiKey, model.openrouterId, model.name, settings.readerPrompt, form, docsWithData, model.reasoningEffort)
          .then(result => {
            results[i] = result;
            if (readerStepIds[i]) {
              updateStep(readerStepIds[i], {
                status: result.error ? 'error' : 'complete',
                endTime: Date.now(),
                details: result.error
                  ? `Error: ${result.error.substring(0, 80)}`
                  : `Confidence: ${result.confidence} | Extracted ${Object.keys(result.extracted_data).length} fields`,
              });
            }
          })
      );

      await Promise.all(promises);
    } else {
      // Run sequentially
      for (let i = 0; i < readerModels.length; i++) {
        const model = readerModels[i];
        const stepId = readerStepIds[i];
        if (!stepId) continue;

        updateStep(stepId, { status: 'active', startTime: Date.now() });

        const result = await runReader(apiKey, model.openrouterId, model.name, settings.readerPrompt, form, docsWithData, model.reasoningEffort);
        results.push(result);

        updateStep(stepId, {
          status: result.error ? 'error' : 'complete',
          endTime: Date.now(),
          details: result.error
            ? `Error: ${result.error.substring(0, 80)}`
            : `Confidence: ${result.confidence}`,
        });
      }
    }

    // Mark unused reader slots as complete
    for (let i = readerModels.length; i < 3; i++) {
      updateStep(readerStepIds[i], {
        status: 'complete',
        details: 'Model disabled',
      });
    }

    setReaderResults(results);

    // Step 6: Judge
    const judgeModel = settings.models.find(m => m.role === 'judge' && m.enabled);
    if (judgeModel) {
      updateStep('judge', {
        status: 'active',
        startTime: Date.now(),
        titleEn: `AI Judge - ${judgeModel.name}`,
        titleAr: `القاضي - ${judgeModel.name}`,
      });

      const judgeRes = await runJudge(apiKey, judgeModel.openrouterId, settings.judgePrompt, form, results);

      updateStep('judge', {
        status: judgeRes.error ? 'error' : 'complete',
        endTime: Date.now(),
        details: judgeRes.error
          ? `Error: ${judgeRes.error.substring(0, 80)}`
          : `Verdict: ${judgeRes.verdict.toUpperCase()} (Score: ${judgeRes.score})`,
      });

      setJudgeResult(judgeRes);

      // Step 7: Final verdict
      updateStep('verdict', {
        status: 'complete',
        endTime: Date.now(),
        details: `${judgeRes.verdict.toUpperCase()} - Score: ${judgeRes.score}/100`,
      });
    } else {
      updateStep('judge', { status: 'error', details: 'No judge model configured' });
    }

    setIsProcessing(false);
  }, [updateStep]);

  const handleHumanDecision = useCallback((decision: HumanDecision, notes: string) => {
    setHumanDecision(decision);
    // Could save to localStorage here for audit trail
    console.log('Human decision:', decision, 'Notes:', notes);
  }, []);

  const reset = useCallback(() => {
    setSteps(INITIAL_STEPS);
    setReaderResults([]);
    setJudgeResult(null);
    setHumanDecision(null);
    setIsProcessing(false);
  }, []);

  return {
    steps,
    readerResults,
    judgeResult,
    humanDecision,
    isProcessing,
    startProcessing,
    handleHumanDecision,
    reset,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
