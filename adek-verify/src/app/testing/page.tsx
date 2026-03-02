'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import TestingUpload from '@/components/testing/TestingUpload';
import TestingResults from '@/components/testing/TestingResults';
import { DocumentAttachment } from '@/lib/data/types';
import { useTestProcessing } from '@/hooks/useTestProcessing';

export default function TestingPage() {
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const { phase1Results, phase2Results, currentPhase, isProcessing, startTest, reset } = useTestProcessing();

  const handleRunTest = () => {
    startTest(documents);
  };

  return (
    <>
      <Header />
      <div className="max-w-[1800px] mx-auto p-4 flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left panel - Upload (narrower) */}
        <div className="w-full lg:w-[30%] order-1 lg:order-none">
          <div className="bg-white rounded-xl shadow-sm border border-adek-border h-full overflow-auto">
            <TestingUpload
              documents={documents}
              onDocumentsChange={setDocuments}
              onRunTest={handleRunTest}
              isProcessing={isProcessing}
              phase1Results={phase1Results}
              phase2Results={phase2Results}
              currentPhase={currentPhase}
            />
          </div>
        </div>

        {/* Right panel - Results (wider) */}
        <div className="w-full lg:w-[70%] order-2 lg:order-none">
          <div className="bg-white rounded-xl shadow-sm border border-adek-border h-full overflow-auto">
            <TestingResults
              phase1Results={phase1Results}
              phase2Results={phase2Results}
              currentPhase={currentPhase}
            />
          </div>
        </div>
      </div>
    </>
  );
}
