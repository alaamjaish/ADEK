# PRD: ADEK Smart Document Verification System
## Codename: ADEK-Verify v0.1 (MVP / Demo Build)

---

## 1. PRODUCT OVERVIEW

### What Are We Building?
An AI-powered document verification web application for ADEK (Abu Dhabi Department of Education and Knowledge) that automates the student enrollment document review process. Staff upload student documents (certificates, transfer letters, Emirates ID), and the system instantly extracts key fields, cross-validates them against the application data, and produces a verification verdict with confidence scores.

### Who Is This For?
- **Primary user**: Khaled (ADEK Regional Representative, Al Dhafra region) and his team
- **End users**: ADEK staff who process student admissions, transfers, and enrollment across private schools
- **Stakeholder**: New ADEK president (Oxford/Harvard background) -- this is a demo for his presentation

### The Problem We Solve
Currently, ADEK staff manually:
1. Open each attachment (certificate, transfer letter, ID) one by one
2. Read and extract student name, grade, school, pass/fail status, DOB
3. Compare extracted info against the application form
4. Check if transfer letter is clean (no outstanding obligations)
5. Verify ID matches the applicant
6. Make an approval/rejection decision

This process is slow, error-prone, inconsistent, and does not scale. Documents arrive in Arabic, English, Hindi, Filipino, and other languages. Staff handle hundreds of applications per enrollment cycle.

### What We Build Today (MVP Scope)
A working web application that demonstrates the full verification pipeline:
- Upload a document (image or PDF)
- AI extracts all relevant fields automatically
- User enters (or imports) the student application data
- System cross-validates and shows match/mismatch for each field
- System generates an overall verification score and recommendation
- Clean, professional UI themed for ADEK

---

## 2. TECHNICAL ARCHITECTURE

### Stack
- **Frontend**: React (single .jsx artifact) with Tailwind CSS
- **AI Engine**: Anthropic API (Claude) for document analysis via vision capabilities
  - Alternative: Google Gemini API if preferred (Khaled has Google Cloud credits)
- **No backend needed for MVP**: Everything runs client-side with direct API calls
- **Export**: Generate verification report as downloadable summary

### Why This Stack?
- Buildable in hours, not days
- No server infrastructure needed for demo
- Claude's vision capabilities handle multi-language documents natively (Arabic, English, Hindi, etc.)
- Beautiful UI achievable with Tailwind in a single file
- Can be deployed instantly as a shareable artifact

---

## 3. USER FLOW

### Flow A: Single Document Verification

```
[Upload Document] --> [AI Extraction] --> [Review Extracted Fields] --> [Enter Student Data] --> [Cross-Validation] --> [Verdict + Report]
```

**Step 1: Upload**
- User clicks "Upload Document" or drags and drops
- Accepts: PDF, JPG, PNG, HEIC
- Shows document preview thumbnail
- User selects document type from dropdown:
  - School Certificate (شهادة مدرسية)
  - Transfer Letter (شهادة انتقال)
  - Emirates ID (الهوية الإماراتية)
  - Passport
  - Other

**Step 2: AI Extraction**
- System sends document image to Claude API with a structured extraction prompt
- Shows loading animation: "Analyzing document... جاري تحليل المستند"
- Returns extracted fields in structured JSON

**Step 3: Review Extracted Fields**
- Display extracted fields in an editable form:
  - Student Full Name (Arabic + English if present)
  - Date of Birth
  - Nationality
  - Grade/Year completed
  - School Name
  - Academic Year
  - Pass/Fail Status
  - Overall GPA/Percentage (if present)
  - Document Language detected
  - Any flags (missing stamp, unclear text, potential tampering indicators)
- Each field shows a confidence level (High / Medium / Low)
- User can manually correct any field the AI got wrong

**Step 4: Enter Application Data**
- Separate panel: "Student Application Data"
- Fields to fill (or paste from existing system):
  - Student Name (as submitted in application)
  - Date of Birth (as submitted)
  - Requested Grade
  - Emirates ID Number
  - Previous School Name
  - Parent/Guardian Name
- This represents what is in the ADEK registration system already

**Step 5: Cross-Validation**
- System compares extracted fields vs. application fields
- For each comparable field, show:
  - MATCH (green checkmark) -- fields are identical or equivalent
  - PARTIAL MATCH (yellow warning) -- similar but not exact (e.g., name transliteration differences)
  - MISMATCH (red X) -- fields do not match
  - NOT AVAILABLE (gray) -- field not present in document
- Special checks:
  - Is the student eligible for the requested grade? (completed grade N-1 successfully)
  - Is the certificate from the current or recent academic year?
  - Are there any outstanding obligations mentioned in transfer letter?

**Step 6: Verdict**
- Overall Verification Score: X/100
- Recommendation: APPROVE / REVIEW REQUIRED / REJECT
- Breakdown of issues found (if any)
- "Generate Report" button --> downloadable summary

### Flow B: Batch Verification (Future Phase, not MVP)
- Upload multiple documents for one student
- System processes all, creates unified verification dashboard

---

## 4. DETAILED FEATURE SPECIFICATIONS

### 4.1 Document Upload Module

```
Component: DocumentUploader
- Drag and drop zone with dashed border
- Click to browse alternative
- File type validation (PDF, JPG, PNG, HEIC)
- Max file size: 10MB
- Preview panel: show uploaded document as image
- Document type selector dropdown
- Bilingual labels (Arabic primary, English secondary)
```

### 4.2 AI Extraction Engine

**Prompt Engineering** (this is the core of the system):

For School Certificates, send this system prompt to Claude Vision:

```
You are ADEK-Verify, an expert document analysis system for the Abu Dhabi Department of Education and Knowledge. You specialize in reading and extracting information from school certificates, transfer letters, and identity documents from schools across the UAE and internationally.

Analyze the uploaded document and extract the following fields. Return ONLY a valid JSON object with no additional text.

{
  "document_type": "certificate | transfer_letter | emirates_id | passport | unknown",
  "document_language": "arabic | english | hindi | urdu | filipino | other",
  "student_name_arabic": "string or null",
  "student_name_english": "string or null",
  "date_of_birth": "YYYY-MM-DD or null",
  "nationality": "string or null",
  "school_name": "string or null",
  "school_curriculum": "UAE_MOE | american | british | indian | filipino | IB | other | unknown",
  "academic_year": "string or null",
  "grade_completed": "string or null (e.g., 'Grade 9', 'Year 10')",
  "pass_fail_status": "pass | fail | conditional | unknown",
  "gpa_or_percentage": "string or null",
  "subjects": [
    {
      "name": "string",
      "grade": "string",
      "score": "string or null"
    }
  ],
  "has_official_stamp": true | false | "unclear",
  "has_signature": true | false | "unclear",
  "outstanding_obligations": "none | string describing obligations",
  "transfer_clearance": "clear | pending | has_issues | not_applicable",
  "emirates_id_number": "string or null",
  "document_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "flags": ["list of any concerns, anomalies, or missing elements"],
  "extraction_confidence": "high | medium | low",
  "raw_text_summary": "Brief summary of what the document says"
}

IMPORTANT RULES:
- If a field is not present in the document, return null
- For Arabic names, provide both Arabic script and transliteration if visible
- UAE standardized certificates follow a known format -- look for Term grades and overall status
- Transfer letters should mention any financial or equipment obligations
- Emirates ID: extract the ID number (784-XXXX-XXXXXXX-X format)
- Flag anything that looks unusual: mismatched dates, missing stamps, poor quality scans, potential alterations
```

### 4.3 Cross-Validation Engine

**Validation Rules** (encode ADEK's actual policies):

```javascript
const validationRules = [
  {
    id: "name_match",
    label: "Student Name Verification",
    label_ar: "التحقق من اسم الطالب",
    compare: (extracted, application) => {
      // Fuzzy match accounting for Arabic/English transliteration differences
      // Use Levenshtein distance or similar
      // Threshold: >85% similarity = MATCH, >60% = PARTIAL, <60% = MISMATCH
    },
    severity: "critical" // CRITICAL = blocks approval
  },
  {
    id: "dob_match",
    label: "Date of Birth Verification",
    label_ar: "التحقق من تاريخ الميلاد",
    compare: (extracted, application) => {
      // Exact date match required
    },
    severity: "critical"
  },
  {
    id: "grade_eligibility",
    label: "Grade Eligibility Check",
    label_ar: "التحقق من أهلية الصف",
    compare: (extracted, application) => {
      // If completed Grade 8 and requesting Grade 9 = eligible
      // If completed Grade 8 and requesting Grade 10 = NOT eligible (skipping)
      // If failed = NOT eligible without remediation
    },
    severity: "critical"
  },
  {
    id: "transfer_clearance",
    label: "Transfer Clearance Status",
    label_ar: "حالة شهادة الانتقال",
    compare: (extracted) => {
      // Check if transfer letter shows any outstanding obligations
      // Unpaid fees, unreturned equipment, etc.
    },
    severity: "critical"
  },
  {
    id: "document_recency",
    label: "Document Recency Check",
    label_ar: "التحقق من حداثة المستند",
    compare: (extracted) => {
      // Certificate should be from current or previous academic year
      // Flag if older than 2 years
    },
    severity: "warning"
  },
  {
    id: "official_stamp",
    label: "Official Stamp Detected",
    label_ar: "التحقق من الختم الرسمي",
    compare: (extracted) => {
      // Check has_official_stamp field
    },
    severity: "warning"
  },
  {
    id: "emirates_id_match",
    label: "Emirates ID Verification",
    label_ar: "التحقق من الهوية الإماراتية",
    compare: (extracted, application) => {
      // Match ID number if both are available
    },
    severity: "critical"
  }
];
```

### 4.4 Verdict Scoring System

```
SCORING:
- Each CRITICAL rule passed = +15 points
- Each WARNING rule passed = +5 points  
- Each CRITICAL rule failed = -25 points (and flags for manual review)
- Each WARNING rule failed = -10 points

VERDICT THRESHOLDS:
- Score >= 80: APPROVE (موافقة) -- Green
- Score 50-79: REVIEW REQUIRED (يحتاج مراجعة) -- Yellow  
- Score < 50: REJECT (مرفوض) -- Red

All verdicts include human-in-the-loop: AI recommends, human decides.
```

### 4.5 UI Design Specifications

**Theme**:
- Primary color: #1B4B6B (ADEK navy blue)
- Secondary color: #C8A951 (ADEK gold)
- Success: #2D8A4E (green)
- Warning: #D4A017 (amber)
- Danger: #C0392B (red)
- Background: #F8F9FA (light gray)
- Font: System Arabic-supporting font stack (Segoe UI, Tahoma, Arial)
- Direction: RTL support (Arabic primary)

**Layout**:
```
+------------------------------------------------------------------+
|  HEADER: ADEK-Verify Logo  |  نظام التحقق الذكي من المستندات     |
+------------------------------------------------------------------+
|                                                                    |
|  LEFT PANEL (40%)              RIGHT PANEL (60%)                  |
|  +------------------------+   +--------------------------------+  |
|  | Document Upload Zone   |   | Extracted Fields               |  |
|  |                        |   |                                |  |
|  | [Preview of uploaded   |   | Student Name: ___________     |  |
|  |  document]             |   | DOB: ___________              |  |
|  |                        |   | Grade: ___________            |  |
|  | Document Type:         |   | School: ___________           |  |
|  | [Dropdown]             |   | Status: ___________           |  |
|  |                        |   | ...                            |  |
|  | [Analyze Button]       |   | Confidence: HIGH               |  |
|  +------------------------+   +--------------------------------+  |
|                                                                    |
|  +------------------------------------------------------------------+
|  | APPLICATION DATA PANEL                                          |
|  | Student Name: [____] | DOB: [____] | Requested Grade: [____]   |
|  | Emirates ID: [____]  | Previous School: [____]                  |
|  +------------------------------------------------------------------+
|                                                                    |
|  +------------------------------------------------------------------+
|  | VERIFICATION RESULTS                                             |
|  |                                                                  |
|  | [====] Name Match          ✓ MATCH                    CRITICAL  |
|  | [====] DOB Match           ✓ MATCH                    CRITICAL  |
|  | [====] Grade Eligibility   ✓ ELIGIBLE                 CRITICAL  |
|  | [====] Transfer Clearance  ⚠ NOT VERIFIED             WARNING   |
|  | [====] Document Stamp      ✓ DETECTED                 WARNING   |
|  | [====] ID Match            — NOT AVAILABLE             INFO     |
|  |                                                                  |
|  | OVERALL SCORE: 85/100                                           |
|  | VERDICT: ✓ APPROVE (موافقة)                                     |
|  |                                                                  |
|  | [Generate Report]  [Process Next Document]                      |
|  +------------------------------------------------------------------+
+------------------------------------------------------------------+
```

**Animations**:
- Document upload: smooth drop zone highlight on drag
- AI processing: pulsing animation with Arabic text "جاري التحليل..."
- Results appear: fields slide in one by one with a subtle fade
- Verdict: large animated checkmark/X with score counter

---

## 5. DATA MODELS

### ExtractedDocument
```typescript
interface ExtractedDocument {
  id: string;
  uploadedAt: Date;
  documentType: 'certificate' | 'transfer_letter' | 'emirates_id' | 'passport' | 'other';
  documentLanguage: string;
  rawImageBase64: string;
  extractedFields: {
    studentNameArabic: string | null;
    studentNameEnglish: string | null;
    dateOfBirth: string | null;
    nationality: string | null;
    schoolName: string | null;
    schoolCurriculum: string;
    academicYear: string | null;
    gradeCompleted: string | null;
    passFailStatus: 'pass' | 'fail' | 'conditional' | 'unknown';
    gpaOrPercentage: string | null;
    subjects: Subject[];
    hasOfficialStamp: boolean | null;
    hasSignature: boolean | null;
    outstandingObligations: string;
    transferClearance: string;
    emiratesIdNumber: string | null;
    documentDate: string | null;
    expiryDate: string | null;
    flags: string[];
    extractionConfidence: 'high' | 'medium' | 'low';
    rawTextSummary: string;
  };
}

interface StudentApplication {
  studentName: string;
  dateOfBirth: string;
  requestedGrade: string;
  emiratesId: string;
  previousSchool: string;
  parentName: string;
}

interface VerificationResult {
  overallScore: number;
  verdict: 'approve' | 'review' | 'reject';
  checks: VerificationCheck[];
  generatedAt: Date;
}

interface VerificationCheck {
  ruleId: string;
  label: string;
  labelAr: string;
  result: 'match' | 'partial' | 'mismatch' | 'not_available';
  severity: 'critical' | 'warning' | 'info';
  details: string;
}
```

---

## 6. SAMPLE TEST SCENARIOS

### Scenario 1: Perfect Match (Expected: APPROVE)
- Upload: UAE standardized certificate, Grade 9, passed
- Application: Same student name, DOB matches, requesting Grade 10
- Result: All critical checks pass, score ~95, APPROVE

### Scenario 2: Grade Mismatch (Expected: REVIEW)
- Upload: Certificate showing Grade 7 completed
- Application: Student requesting Grade 9 (skipping a grade)
- Result: Grade eligibility fails, score ~55, REVIEW REQUIRED

### Scenario 3: Name Discrepancy (Expected: REVIEW)
- Upload: Certificate with Arabic name "محمد أحمد علي"
- Application: English name "Mohammed Ahmed Ali" (transliteration)
- Result: Fuzzy match detects similarity but flags for human confirmation

### Scenario 4: Outstanding Obligations (Expected: REJECT)
- Upload: Transfer letter mentioning unpaid fees of AED 5,000
- Application: Standard enrollment request
- Result: Transfer clearance fails, score ~30, REJECT

### Scenario 5: Foreign Certificate (Expected: REVIEW)
- Upload: Indian CBSE certificate in English
- Application: Student requesting admission
- Result: Extraction works but curriculum mapping needs manual verification

---

## 7. MVP SCOPE BOUNDARIES

### In Scope (Build Today):
- Single document upload and analysis
- AI-powered field extraction using Claude Vision API
- Manual entry of student application data for cross-validation
- 7 core validation rules
- Verdict scoring system
- Clean, bilingual (Arabic/English) UI
- Responsive design

### Out of Scope (Future Phases):
- Direct integration with eSIS systems (requires API access from ADEK)
- Batch document processing
- User authentication and role-based access
- Persistent storage / database
- Audit trail logging to a backend
- Multiple document types per student in one session
- PDF report generation (v0.2)
- Arabic NLP for name matching (v0.2 -- use simpler fuzzy match for now)

---

## 8. SUCCESS CRITERIA

The demo is successful if:
1. Khaled uploads a document (even a screenshot of a certificate) and sees fields extracted correctly
2. The cross-validation shows clear match/mismatch indicators
3. The verdict system gives a logical recommendation
4. The UI looks professional and feels like a real product, not a prototype
5. Khaled says "This is exactly what I need" or shares his screen with excitement

---

## 9. DEVELOPMENT INSTRUCTIONS

Build this as a single React artifact (.jsx file) with:
- All Tailwind CSS styling (no external CSS files)
- Anthropic API calls for document analysis
- RTL support for Arabic text
- State management with React hooks
- Responsive layout that works on desktop and tablet

The Anthropic API key handling is built into the artifact environment -- use the standard fetch pattern to api.anthropic.com/v1/messages with the vision capability.

Priority order for building:
1. UI shell with upload zone and layout
2. Document upload and base64 conversion
3. API integration for extraction
4. Display of extracted fields
5. Application data entry form
6. Cross-validation logic
7. Scoring and verdict system
8. Polish animations and bilingual text

---

## 10. FUTURE ROADMAP (What to Promise Khaled)

| Phase | Feature | Timeline |
|-------|---------|----------|
| v0.1 | Single document verification (TODAY) | Day 1 |
| v0.2 | Multi-document per student + PDF reports | Week 1-2 |
| v0.3 | Batch processing (bulk enrollment period) | Week 3-4 |
| v1.0 | eSIS integration + user auth + audit trail | Month 2-3 |
| v1.5 | CXMS request classifier add-on | Month 3-4 |
| v2.0 | Policy chatbot (RAG) | Month 4-5 |
| v3.0 | Predictive enrollment analytics | Month 5-7 |
| v4.0 | Classroom monitoring / child protection | Month 8-12 |

---

*Document prepared for: Alaa (AlaLab / Productivity Engineering)*
*Client: Khaled, ADEK Regional Representative, Al Dhafra*
*Date: March 1, 2026*
*Classification: Working Draft -- Demo Build*

