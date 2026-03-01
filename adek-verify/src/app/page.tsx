'use client';

import Header from '@/components/layout/Header';
import SplitPanel from '@/components/layout/SplitPanel';
import ApplicationForm from '@/components/sender/ApplicationForm';
import ProcessingPipeline from '@/components/receiver/ProcessingPipeline';
import { useApplicationForm } from '@/hooks/useApplicationForm';
import { useAIProcessing } from '@/hooks/useAIProcessing';
import { useSettings } from '@/hooks/useSettings';

export default function HomePage() {
  const { settings } = useSettings();
  const { formData, setFormData, resetForm } = useApplicationForm();
  const {
    steps,
    readerResults,
    judgeResult,
    humanDecision,
    isProcessing,
    startProcessing,
    handleHumanDecision,
    reset: resetPipeline,
  } = useAIProcessing();

  const handleSubmit = () => {
    startProcessing(formData, settings);
  };

  const handleReset = () => {
    resetPipeline();
    resetForm();
  };

  return (
    <>
      <Header />
      <SplitPanel
        right={
          <ApplicationForm
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
          />
        }
        left={
          <ProcessingPipeline
            steps={steps}
            readerResults={readerResults}
            judgeResult={judgeResult}
            humanDecision={humanDecision}
            humanInLoop={settings.humanInLoop}
            onHumanDecision={handleHumanDecision}
            onReset={handleReset}
          />
        }
      />
    </>
  );
}
