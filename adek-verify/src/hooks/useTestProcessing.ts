'use client';

import { useState, useCallback } from 'react';
import { DocumentAttachment, TestModelResult } from '@/lib/data/types';
import { runTestReader, runTestConsensusReader } from '@/lib/ai/test-reader';
import { loadSettings } from '@/lib/storage';

export type TestPhase = 'idle' | 'phase1' | 'phase2' | 'done';

export function useTestProcessing() {
  const [phase1Results, setPhase1Results] = useState<TestModelResult[]>([]);
  const [phase2Results, setPhase2Results] = useState<TestModelResult[]>([]);
  const [currentPhase, setCurrentPhase] = useState<TestPhase>('idle');
  const [isProcessing, setIsProcessing] = useState(false);

  const startTest = useCallback(async (documents: DocumentAttachment[]) => {
    const settings = loadSettings();
    const apiKey = settings.apiKey;

    if (!apiKey) {
      alert('No API key configured. Go to Settings.');
      return;
    }

    const docsWithData = documents.filter(d => d.base64);
    if (docsWithData.length === 0) return;

    setIsProcessing(true);
    setPhase2Results([]);

    // --- Phase 1: Blind extraction ---
    setCurrentPhase('phase1');
    const allModels = settings.models.filter(m => m.enabled);

    const initialP1: TestModelResult[] = allModels.map(m => ({
      modelId: m.openrouterId,
      modelName: m.name,
      status: 'running' as const,
      confidence: '' as const,
      extracted_data: null,
      phase: 1 as const,
      startTime: Date.now(),
    }));
    setPhase1Results(initialP1);

    const p1Final: TestModelResult[] = [...initialP1];

    const p1Promises = allModels.map((model, index) =>
      runTestReader(apiKey, model.openrouterId, model.name, docsWithData, model.reasoningEffort)
        .then(result => {
          p1Final[index] = result;
          setPhase1Results(prev => prev.map((r, i) => i === index ? result : r));
        })
    );

    await Promise.all(p1Promises);

    // --- Phase 2: Consensus round ---
    const successfulP1 = p1Final.filter(r => r.status === 'complete');
    if (successfulP1.length < 2) {
      // Not enough models succeeded — skip Phase 2
      setCurrentPhase('done');
      setIsProcessing(false);
      return;
    }

    setCurrentPhase('phase2');

    const initialP2: TestModelResult[] = successfulP1.map(r => ({
      modelId: r.modelId,
      modelName: r.modelName,
      status: 'running' as const,
      confidence: '' as const,
      extracted_data: null,
      phase: 2 as const,
      startTime: Date.now(),
    }));
    setPhase2Results(initialP2);

    const modelConfigs = allModels.reduce<Record<string, typeof allModels[0]>>((acc, m) => {
      acc[m.openrouterId] = m;
      return acc;
    }, {});

    const p2Promises = successfulP1.map((ownP1, index) => {
      const others = successfulP1.filter(r => r.modelId !== ownP1.modelId);
      const config = modelConfigs[ownP1.modelId];
      return runTestConsensusReader(
        apiKey,
        ownP1.modelId,
        ownP1.modelName,
        docsWithData,
        ownP1,
        others,
        config?.reasoningEffort,
      ).then(result => {
        setPhase2Results(prev => prev.map((r, i) => i === index ? result : r));
      });
    });

    await Promise.all(p2Promises);
    setCurrentPhase('done');
    setIsProcessing(false);
  }, []);

  const reset = useCallback(() => {
    setPhase1Results([]);
    setPhase2Results([]);
    setCurrentPhase('idle');
    setIsProcessing(false);
  }, []);

  return { phase1Results, phase2Results, currentPhase, isProcessing, startTest, reset };
}
