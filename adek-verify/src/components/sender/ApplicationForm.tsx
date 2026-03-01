'use client';

import { useLang } from '@/app/layout';
import Button from '@/components/ui/Button';
import StudentDataSection from './StudentDataSection';
import AdmissionDataSection from './AdmissionDataSection';
import GuardianDataSection from './GuardianDataSection';
import DocumentUpload from './DocumentUpload';
import { ApplicationFormData } from '@/lib/data/types';

interface Props {
  formData: ApplicationFormData;
  onFormChange: (data: ApplicationFormData) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export default function ApplicationForm({ formData, onFormChange, onSubmit, isProcessing }: Props) {
  const { t } = useLang();

  const hasEmiratesId = formData.documents.some(
    d => d.type === 'emirates_id' && d.base64
  );

  const requiredFilled =
    formData.student.studentNameArabic &&
    formData.student.studentNameEnglish &&
    formData.student.gender &&
    formData.student.dateOfBirth &&
    formData.admission.targetSchool &&
    formData.admission.targetGrade &&
    formData.guardian.guardianName &&
    formData.guardian.emiratesIdNumber &&
    formData.documents.filter(d => d.base64).length >= 2;

  return (
    <div className="p-6">
      {/* Panel header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-adek-gold/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-adek-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-adek-navy">
            {t('المرسل (المدرسة)', 'Sender (School)')}
          </h2>
          <p className="text-xs text-adek-text-secondary">
            {t('نموذج طلب التسجيل', 'Enrollment Application Form')}
          </p>
        </div>
      </div>

      {/* Form sections */}
      <div className="space-y-6">
        <StudentDataSection
          data={formData.student}
          onChange={(student) => onFormChange({ ...formData, student })}
        />

        <AdmissionDataSection
          data={formData.admission}
          onChange={(admission) => onFormChange({ ...formData, admission })}
        />

        <GuardianDataSection
          data={formData.guardian}
          onChange={(guardian) => onFormChange({ ...formData, guardian })}
        />

        <DocumentUpload
          documents={formData.documents}
          onChange={(documents) => onFormChange({ ...formData, documents })}
          hasEmiratesId={hasEmiratesId}
        />

        {/* Submit button */}
        <div className="pt-4 border-t border-adek-border">
          <Button
            variant="secondary"
            size="lg"
            onClick={onSubmit}
            disabled={!requiredFilled || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-adek-navy/30 border-t-adek-navy rounded-full animate-spin-slow" />
                {t('جاري المعالجة...', 'Processing...')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('إرسال الطلب للتحقق', 'Submit Application for Verification')}
              </>
            )}
          </Button>

          {!requiredFilled && (
            <p className="text-xs text-adek-warning mt-2 text-center">
              {t(
                'يرجى ملء جميع الحقول المطلوبة ورفع المستندات',
                'Please fill all required fields and upload documents'
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
