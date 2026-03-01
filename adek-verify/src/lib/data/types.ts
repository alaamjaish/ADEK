// ==========================================
// ADEK Smart Document Verification System
// Type Definitions
// ==========================================

// --- Application Form Types ---

export interface StudentData {
  esisNumber: string;
  applicationNumber: string;
  studentNameArabic: string;
  studentNameEnglish: string;
  gender: 'male' | 'female' | '';
  dateOfBirth: string;
  age: number | null;
  nationality: string;
  religion: 'muslim' | 'non-muslim' | '';
  registrationDate: string;
}

export interface AdmissionData {
  targetRegion: string;
  targetSchool: string;
  targetCurriculum: string;
  targetGrade: string;
}

export interface GuardianData {
  guardianName: string;
  emiratesIdNumber: string;
  phoneNumber: string;
  email: string;
  idExpiryDate: string;
  address: string;
}

export interface DocumentAttachment {
  id: string;
  type: DocumentType;
  file: File | null;
  fileName: string;
  fileSize: number;
  base64: string;
  mimeType: string;
  preview: string;
}

export type DocumentType =
  | 'emirates_id'
  | 'transfer_certificate'
  | 'previous_year_certificate'
  | 'passport'
  | 'proof_no_id';

export interface DocumentTypeInfo {
  type: DocumentType;
  labelAr: string;
  labelEn: string;
  required: boolean;
  conditionalNote?: string;
}

export const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { type: 'emirates_id', labelAr: 'الهوية الإماراتية', labelEn: 'Emirates ID', required: true, conditionalNote: 'or Proof of No ID' },
  { type: 'transfer_certificate', labelAr: 'شهادة الانتقال / الترك', labelEn: 'Transfer Certificate', required: true },
  { type: 'previous_year_certificate', labelAr: 'شهادة السنة السابقة', labelEn: 'Previous Year Certificate', required: true },
  { type: 'passport', labelAr: 'جواز السفر', labelEn: 'Passport', required: true },
  { type: 'proof_no_id', labelAr: 'إثبات عدم وجود الهوية', labelEn: 'Proof of No ID', required: false, conditionalNote: 'Only if no Emirates ID' },
];

export interface ApplicationFormData {
  student: StudentData;
  admission: AdmissionData;
  guardian: GuardianData;
  documents: DocumentAttachment[];
}

// --- School Data Types ---

export interface GradeCapacity {
  grade: string;
  maxCapacity: number;
  currentMale: number;
  currentFemale: number;
}

export interface School {
  id: string;
  nameEn: string;
  nameAr: string;
  curriculum: string;
  curriculumAr: string;
  region: string;
  location: string;
  gradesOffered: string[];
  capacity: GradeCapacity[];
}

// --- AI Processing Types ---

export type PipelineStepStatus = 'pending' | 'active' | 'complete' | 'error';

export interface PipelineStep {
  id: string;
  titleAr: string;
  titleEn: string;
  status: PipelineStepStatus;
  details?: string;
  startTime?: number;
  endTime?: number;
}

export interface ExtractedData {
  student_name_arabic: string;
  student_name_english: string;
  nationality: string;
  date_of_birth: string;
  grade_completed: string;
  pass_fail: 'pass' | 'fail' | 'unknown';
  school_name: string;
  transfer_clearance: 'clear' | 'pending' | 'blocked';
  outstanding_obligations: string;
  emirates_id_number: string;
  has_official_stamp: boolean;
  has_signature: boolean;
  document_dates: Record<string, string>;
  flags: string[];
}

export interface CrossValidation {
  name_match: { status: 'match' | 'partial' | 'mismatch'; confidence: number; details: string };
  dob_match: { status: 'match' | 'mismatch'; confidence: number; details?: string };
  grade_eligibility: { status: 'eligible' | 'ineligible'; details: string };
  transfer_clearance: { status: 'clear' | 'pending' | 'blocked'; details?: string };
  id_verification: { status: 'match' | 'mismatch' | 'expired'; details?: string };
}

export interface ReaderResult {
  model: string;
  modelName: string;
  confidence: 'high' | 'medium' | 'low';
  extracted_data: ExtractedData;
  cross_validation: CrossValidation;
  raw_response?: string;
  error?: string;
}

export interface ValidationCheck {
  rule: string;
  ruleAr: string;
  result: 'pass' | 'fail' | 'warning';
  severity: 'critical' | 'warning' | 'info';
  details: string;
  detailsAr: string;
  points: number;
}

export type Verdict = 'approve' | 'review' | 'reject';

export interface JudgeResult {
  verdict: Verdict;
  score: number;
  reasoning: string;
  reasoningAr: string;
  disagreements: string[];
  checks: ValidationCheck[];
  recommendation_ar: string;
  recommendation_en: string;
  raw_response?: string;
  error?: string;
}

export type HumanDecision = 'accept' | 'reject' | 'return';

export interface ProcessingResult {
  applicationId: string;
  timestamp: string;
  readerResults: ReaderResult[];
  judgeResult: JudgeResult | null;
  humanDecision: HumanDecision | null;
  humanNotes: string;
}

// --- Settings Types ---

export interface ModelConfig {
  id: string;
  name: string;
  openrouterId: string;
  enabled: boolean;
  role: 'reader' | 'judge';
  reasoningEffort: 'high' | 'medium' | 'low';
}

export interface AppSettings {
  apiKey: string;
  readerPrompt: string;
  judgePrompt: string;
  models: ModelConfig[];
  humanInLoop: boolean;
  parallelProcessing: boolean;
  thresholds: {
    approve: number;
    review: number;
  };
  language: 'ar' | 'en';
}

// --- UI Types ---

export interface BilingualText {
  ar: string;
  en: string;
}
