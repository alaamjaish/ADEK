'use client';

import { useState, useCallback } from 'react';
import { ApplicationFormData, StudentData, AdmissionData, GuardianData, DocumentAttachment } from '@/lib/data/types';
import { generateApplicationNumber } from '@/lib/utils';

function createInitialForm(): ApplicationFormData {
  return {
    student: {
      esisNumber: '',
      applicationNumber: generateApplicationNumber(),
      studentNameArabic: '',
      studentNameEnglish: '',
      gender: '',
      dateOfBirth: '',
      age: null,
      religion: '',
      registrationDate: new Date().toISOString().split('T')[0],
    },
    admission: {
      targetRegion: '',
      targetSchool: '',
      targetCurriculum: '',
      targetGrade: '',
    },
    guardian: {
      guardianName: '',
      emiratesIdNumber: '',
      phoneNumber: '',
      email: '',
      idExpiryDate: '',
      address: '',
    },
    documents: [],
  };
}

export function useApplicationForm() {
  const [formData, setFormData] = useState<ApplicationFormData>(createInitialForm);

  const updateStudent = useCallback((student: StudentData) => {
    setFormData(prev => ({ ...prev, student }));
  }, []);

  const updateAdmission = useCallback((admission: AdmissionData) => {
    setFormData(prev => ({ ...prev, admission }));
  }, []);

  const updateGuardian = useCallback((guardian: GuardianData) => {
    setFormData(prev => ({ ...prev, guardian }));
  }, []);

  const updateDocuments = useCallback((documents: DocumentAttachment[]) => {
    setFormData(prev => ({ ...prev, documents }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialForm());
  }, []);

  return {
    formData,
    setFormData,
    updateStudent,
    updateAdmission,
    updateGuardian,
    updateDocuments,
    resetForm,
  };
}
