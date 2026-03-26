 Ready to code?
                                                                                                                          Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 ADEK Smart Document Verification System - Implementation Plan

 Context

 ADEK (Abu Dhabi Department of Education and Knowledge) staff in Al Dhafra region manually process thousands of student  
 enrollment applications. Each application requires reading 3-5 documents (certificates, IDs, transfer letters) in       
 multiple languages (Arabic, English, Hindi, etc.), extracting data, cross-checking against the application form,        
 checking policies, and making an approve/reject decision. This is slow, error-prone, and doesn't scale (4,000-5,000     
 applications/day during peak enrollment Sep-Dec).

 We're building an AI-powered verification system that uses 3 AI models as independent readers + 1 AI Judge to automate  
 this process. The system is a demo for the new ADEK president and a working prototype for Khaled's team.

 ---
 Architecture Overview

 Tech Stack

 - Framework: Next.js (App Router)
 - Styling: Tailwind CSS
 - Storage: localStorage (no database for MVP)
 - AI Gateway: OpenRouter API (single API key, 4 models)
 - Deployment: Vercel
 - Language: Arabic-first RTL, English toggle

 AI Model Architecture ("Council of Wise Men" - مجلس الحكماء)

 ┌──────────┬───────────────────┬───────────────────────────────┬────────┬─────────┬────────────────────────────┐        
 │   Role   │       Model       │         OpenRouter ID         │ Vision │ Context │ Cost (in/out per M tokens) │        
 ├──────────┼───────────────────┼───────────────────────────────┼────────┼─────────┼────────────────────────────┤        
 │ Reader 1 │ Claude Sonnet 4.6 │ anthropic/claude-sonnet-4.6   │ Yes    │ 1M      │ $3 / $15                   │        
 ├──────────┼───────────────────┼───────────────────────────────┼────────┼─────────┼────────────────────────────┤        
 │ Reader 2 │ Gemini 3.1 Pro    │ google/gemini-3.1-pro-preview │ Yes    │ 1M      │ $2 / $12                   │        
 ├──────────┼───────────────────┼───────────────────────────────┼────────┼─────────┼────────────────────────────┤        
 │ Reader 3 │ GPT-5.2           │ openai/gpt-5.2                │ Yes    │ 400K    │ $1.75 / $14                │        
 ├──────────┼───────────────────┼───────────────────────────────┼────────┼─────────┼────────────────────────────┤        
 │ Judge    │ Claude Opus 4.6   │ anthropic/claude-opus-4.6     │ Yes    │ 1M      │ $5 / $25                   │        
 └──────────┴───────────────────┴───────────────────────────────┴────────┴─────────┴────────────────────────────┘        

 Flow: All 3 readers receive ALL documents + form data in parallel. Each extracts structured JSON independently. Opus    
 Judge receives all 3 results + original data, compares them, and produces the final verdict. Human makes the last call. 

 ---
 UI Layout - Single Page, Two Panels

 +------------------------------------------------------------------+
 |  HEADER: ADEK-Verify  |  نظام التحقق الذكي  | [Settings] [Lang] |
 +------------------------------------------------------------------+
 |                                                                    |
 |  RIGHT PANEL (50%) - RTL      LEFT PANEL (50%) - RTL              |
 |  +------------------------+   +--------------------------------+  |
 |  | المرسل (Sender/School) |   | المتلقي (Receiver/ADEK)       |  |
 |  |                        |   |                                |  |
 |  | [Application Form]     |   | [Live Processing Pipeline]    |  |
 |  | - Student Data         |   | Step 1: Reading documents...  |  |
 |  | - Admission Data       |   | Step 2: Model 1 extracting... |  |
 |  | - Guardian Data        |   | Step 3: Model 2 extracting... |  |
 |  | - Document Uploads     |   | Step 4: Model 3 extracting... |  |
 |  |                        |   | Step 5: Judge analyzing...    |  |
 |  | [Submit Application]   |   | Step 6: VERDICT: ✓ APPROVE    |  |
 |  +------------------------+   |                                |  |
 |                               | [Human: Accept] [Reject] [Back]|  |
 |                               +--------------------------------+  |
 +------------------------------------------------------------------+



 ---
 Detailed Feature Breakdown

 1. Application Form (Sender/School Side - Right Panel)

 Section A: Student Data (بيانات الطالب)
 - eSIS Number (رقم الطالب)
 - Application Number (رقم الاستمارة)
 - Student Name - Arabic (اسم الطالب بالعربي)
 - Student Name - English (اسم الطالب بالإنجليزي)
 - Gender (الجنس) - dropdown: Male/Female
 - Date of Birth (تاريخ الميلاد) - date picker
 - Age (العمر) - auto-calculated from DOB
 - Religion (الديانة) - dropdown: Muslim/Non-Muslim (affects curriculum)
 - Registration Date (تاريخ التسجيل) - auto-filled

 Section B: Admission Data (بيانات القبول)
 - Target Region (المنطقة المرغوبة) - dropdown (Al Dhafra for MVP)
 - Target School (المدرسة المرغوبة) - dropdown (filtered by region, from mock data)
 - Target Curriculum (المنهج المرغوب) - dropdown (filtered by school: UAE MOE, American, British, Indian, IB, etc.)      
 - Target Grade (الصف المرغوب) - dropdown (KG1 to Grade 12)

 Section C: Guardian Data (معلومات ولي الأمر)
 - Guardian Name (اسم ولي الأمر)
 - Emirates ID Number (رقم الهوية الإماراتية)
 - Phone Number (رقم الهاتف)
 - Email (البريد الإلكتروني)
 - ID Expiry Date (تاريخ انتهاء الهوية)
 - Address (العنوان) - text field

 Section D: Document Attachments (المرفقات)
 Each attachment: drag-drop zone + file browser, accepts PDF/JPG/PNG, max 10MB, thumbnail preview.

 ┌─────┬───────────────────────────┬────────────────────────┬───────────────┐
 │  #  │         Document          │      Arabic Label      │   Required    │
 ├─────┼───────────────────────────┼────────────────────────┼───────────────┤
 │ 1   │ Emirates ID               │ الهوية الإماراتية      │ Yes (or #5)   │
 ├─────┼───────────────────────────┼────────────────────────┼───────────────┤
 │ 2   │ Transfer Certificate      │ شهادة الانتقال / الترك │ Yes           │
 ├─────┼───────────────────────────┼────────────────────────┼───────────────┤
 │ 3   │ Previous Year Certificate │ شهادة السنة السابقة    │ Yes           │
 ├─────┼───────────────────────────┼────────────────────────┼───────────────┤
 │ 4   │ Passport                  │ جواز السفر             │ Yes           │
 ├─────┼───────────────────────────┼────────────────────────┼───────────────┤
 │ 5   │ Proof of No ID            │ إثبات عدم وجود الهوية  │ Only if no #1 │
 └─────┴───────────────────────────┴────────────────────────┴───────────────┘

 2. AI Processing Pipeline (Receiver/ADEK Side - Left Panel)

 Step-by-step streaming display:

 Step 1: Receiving Application          ✓ Complete
         Application #12345 from SABIS International

 Step 2: Reading Documents              ✓ Complete
         5 documents loaded (2 PDF, 3 images)

 Step 3: AI Reader 1 - Claude Sonnet    ⟳ Processing...
         Reading Emirates ID...
         Extracted: Name matches ✓
         Reading Transfer Certificate...
         [streaming results as they come]

 Step 4: AI Reader 2 - Gemini 3.1 Pro   ◯ Waiting
 Step 5: AI Reader 3 - GPT-5.2          ◯ Waiting
 Step 6: AI Judge - Claude Opus          ◯ Waiting
 Step 7: Final Verdict                   ◯ Waiting

 Note: Steps 3-5 run in PARALLEL (all 3 readers at once). Step 6 starts after all 3 complete.

 Each reader model returns structured JSON:
 {
   "model": "claude-sonnet-4.6",
   "confidence": "high",
   "extracted_data": {
     "student_name_arabic": "...",
     "student_name_english": "...",
     "date_of_birth": "YYYY-MM-DD",
     "grade_completed": "Grade 9",
     "pass_fail": "pass",
     "school_name": "...",
     "transfer_clearance": "clear",
     "outstanding_obligations": "none",
     "emirates_id_number": "784-XXXX-XXXXXXX-X",
     "has_official_stamp": true,
     "has_signature": true,
     "document_dates": {},
     "flags": []
   },
   "cross_validation": {
     "name_match": { "status": "match", "confidence": 0.95, "details": "..." },
     "dob_match": { "status": "match", "confidence": 1.0 },
     "grade_eligibility": { "status": "eligible", "details": "Completed Grade 9, requesting Grade 10" },
     "transfer_clearance": { "status": "clear" },
     "id_verification": { "status": "match" }
   }
 }

 The Judge (Opus 4.6) receives:
 - All 3 reader results
 - Original form data
 - School capacity data
 - Policy rules

 Judge returns:
 {
   "verdict": "approve | review | reject",
   "score": 85,
   "reasoning": "All three models agree on name match, DOB, and grade eligibility...",
   "disagreements": [],
   "checks": [
     { "rule": "name_match", "result": "pass", "severity": "critical" },
     { "rule": "seat_availability", "result": "pass", "severity": "critical" }
   ],
   "recommendation_ar": "موافقة - جميع المعايير مستوفاة",
   "recommendation_en": "Approve - All criteria met"
 }

 3. Validation Rules

 ┌──────────────────┬─────────────────┬──────────┬──────────────────────────────────────────────────────────────────┐    
 │       Rule       │     Arabic      │ Severity │                              Logic                               │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Name Match       │ مطابقة الاسم    │ Critical │ Fuzzy match name across ID, certificate, transfer doc, and form  │    
 │                  │                 │          │ (>85% = match, >60% = partial)                                   │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ DOB Match        │ مطابقة تاريخ    │ Critical │ Exact date match between documents and form                      │    
 │                  │ الميلاد         │          │                                                                  │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Grade            │ أهلية الصف      │ Critical │ Completed grade N-1, requesting grade N. Age within 3-year       │    
 │ Eligibility      │                 │          │ tolerance. Must have passed.                                     │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Transfer         │ شهادة الانتقال  │ Critical │ No outstanding obligations (fees, equipment, etc.)               │    
 │ Clearance        │                 │          │                                                                  │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Seat             │ توفر المقاعد    │ Critical │ Target school + grade has available seats (max 30 per class,     │    
 │ Availability     │                 │          │ check gender split)                                              │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Emirates ID      │ صلاحية الهوية   │ Critical │ ID not expired, or valid proof of no ID provided                 │    
 │ Valid            │                 │          │                                                                  │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Document Stamps  │ الأختام الرسمية │ Warning  │ Official stamps and signatures detected on certificates          │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Document Recency │ حداثة المستندات │ Warning  │ Certificates from current or previous academic year              │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Foreign          │ اعتماد الخارجية │ Warning  │ If from outside UAE: Gulf/Europe/USA/Australia exempt. Others    │    
 │ Attestation      │                 │          │ need MoFA attestation.                                           │    
 ├──────────────────┼─────────────────┼──────────┼──────────────────────────────────────────────────────────────────┤    
 │ Disaster Country │ دول الكوارث     │ Info     │ If student from disaster country, relaxed document requirements. │    
 │                  │                 │          │  Placement test accepted.                                        │    
 └──────────────────┴─────────────────┴──────────┴──────────────────────────────────────────────────────────────────┘    

 Scoring:
 - Critical pass = +15 pts | Critical fail = -25 pts
 - Warning pass = +5 pts | Warning fail = -10 pts
 - >= 80: APPROVE (موافقة) | 50-79: REVIEW (يحتاج مراجعة) | < 50: REJECT (مرفوض)

 4. Mock School Data (6 Al Dhafra Schools)

 Generate realistic data for 6 schools:
 1. SABIS International School - Al Dhafra (American curriculum)
 2. Al Dhafra Private Academy (British curriculum)
 3. Delhi Private School - Madinat Zayed (Indian CBSE)
 4. Liwa International School (IB curriculum)
 5. Al Gharbia Private School (UAE MOE curriculum)
 6. Philippine International School - Al Dhafra (Filipino curriculum)

 Each school includes: name, curriculum, grades offered, max capacity per grade (30), current enrollment per grade (with 
  gender split), location.

 5. Settings Page

 Accessible from header gear icon. Sections:

 A. API Configuration
 - OpenRouter API Key (stored in localStorage, masked input)
 - Test connection button

 B. System Prompt Editor
 - Editable text area for the reader prompt (shared by all 3 models)
 - Editable text area for the judge prompt
 - Reset to default button
 - Saved to localStorage

 C. Model Configuration
 - Toggle individual models on/off
 - Select which model is the judge
 - Reasoning effort level per model (high/medium/low)

 D. Quick Settings (also on main page as collapsible panel)
 - Toggle: Human-in-the-loop required (yes/no)
 - Toggle: Parallel processing (yes/no)
 - Scoring thresholds (approve/review/reject cutoffs)

 6. Design System

 - Primary: #1B4B6B (ADEK navy)
 - Secondary: #C8A951 (ADEK gold)
 - Success: #2D8A4E | Warning: #D4A017 | Danger: #C0392B
 - Background: #F8F9FA
 - Font stack: Segoe UI, Tahoma, Arial (Arabic-supporting)
 - Direction: RTL default with LTR toggle
 - Logo: Text-based placeholder "ADEK-Verify | نظام التحقق الذكي"

 ---
 Project Structure

 adek-verify/
 ├── src/
 │   ├── app/
 │   │   ├── layout.tsx              # Root layout with RTL, fonts, providers
 │   │   ├── page.tsx                # Main split-panel page
 │   │   ├── settings/
 │   │   │   └── page.tsx            # Settings page
 │   │   └── globals.css             # Tailwind + custom styles
 │   ├── components/
 │   │   ├── layout/
 │   │   │   ├── Header.tsx          # ADEK header + nav
 │   │   │   └── SplitPanel.tsx      # Two-panel container
 │   │   ├── sender/
 │   │   │   ├── ApplicationForm.tsx # Full multi-section form
 │   │   │   ├── StudentDataSection.tsx
 │   │   │   ├── AdmissionDataSection.tsx
 │   │   │   ├── GuardianDataSection.tsx
 │   │   │   └── DocumentUpload.tsx  # Drag-drop per document type
 │   │   ├── receiver/
 │   │   │   ├── ProcessingPipeline.tsx  # Step-by-step live view
 │   │   │   ├── PipelineStep.tsx        # Individual step component
 │   │   │   ├── ModelResult.tsx         # Single model's extraction display
 │   │   │   ├── VerdictDisplay.tsx      # Final score + verdict
 │   │   │   └── HumanDecision.tsx       # Accept/Reject/Return buttons
 │   │   ├── settings/
 │   │   │   ├── ApiConfig.tsx
 │   │   │   ├── PromptEditor.tsx
 │   │   │   └── QuickSettings.tsx
 │   │   └── ui/                     # Shared UI primitives
 │   │       ├── Button.tsx
 │   │       ├── Input.tsx
 │   │       ├── Select.tsx
 │   │       ├── FileDropZone.tsx
 │   │       └── ProgressIndicator.tsx
 │   ├── lib/
 │   │   ├── ai/
 │   │   │   ├── openrouter.ts       # OpenRouter API client
 │   │   │   ├── prompts.ts          # Default system prompts
 │   │   │   ├── reader.ts           # Reader model logic (send docs, parse response)
 │   │   │   └── judge.ts            # Judge model logic (compare results, verdict)
 │   │   ├── validation/
 │   │   │   ├── rules.ts            # All validation rules
 │   │   │   ├── scoring.ts          # Score calculation
 │   │   │   └── name-matching.ts    # Fuzzy name matching (Arabic/English)
 │   │   ├── data/
 │   │   │   ├── schools.ts          # Mock school data (6 schools)
 │   │   │   └── types.ts            # TypeScript interfaces
 │   │   ├── storage.ts              # localStorage helpers
 │   │   └── utils.ts                # Shared utilities
 │   └── hooks/
 │       ├── useApplicationForm.ts   # Form state management
 │       ├── useAIProcessing.ts      # AI pipeline orchestration
 │       └── useSettings.ts          # Settings state from localStorage
 ├── public/
 │   └── (static assets if any)
 ├── tailwind.config.ts
 ├── next.config.ts
 ├── package.json
 └── tsconfig.json

 ---
 Build Sequence

 Phase 1: Project Setup + Layout Shell

 1. Initialize Next.js project with Tailwind CSS
 2. Configure RTL support and Arabic font stack
 3. Build Header component with ADEK branding
 4. Build SplitPanel layout (50/50, responsive)
 5. Create settings page route

 Phase 2: Sender Panel - Application Form

 6. Build StudentDataSection with all fields
 7. Build AdmissionDataSection with cascading dropdowns (region -> school -> curriculum -> grade)
 8. Build GuardianDataSection
 9. Build DocumentUpload component (drag-drop, preview, base64 conversion)
 10. Wire up form state with useApplicationForm hook

 Phase 3: Mock Data + Storage

 11. Create 6 school mock data objects with full capacity/enrollment data
 12. Implement localStorage helpers for settings, API key, form data persistence
 13. Build settings page (API key, prompt editor, model config)

 Phase 4: AI Integration

 14. Build OpenRouter API client (handles all 4 models through single endpoint)
 15. Implement reader logic: convert documents to base64, build prompt, call model, parse JSON response
 16. Implement parallel execution: fire all 3 readers simultaneously
 17. Implement judge logic: collect 3 results, build judge prompt, call Opus, parse verdict
 18. Build useAIProcessing hook to orchestrate the full pipeline

 Phase 5: Receiver Panel - Live Processing View

 19. Build PipelineStep component (pending/active/complete states with animations)
 20. Build ProcessingPipeline with streaming step-by-step display
 21. Build ModelResult component (show what each reader found)
 22. Build VerdictDisplay (score animation, verdict with Arabic/English)
 23. Build HumanDecision component (Accept/Reject/Return buttons)

 Phase 6: Validation + Scoring

 24. Implement all validation rules (name matching, DOB, grade eligibility, etc.)
 25. Implement scoring system
 26. Wire validation into the judge prompt and display

 Phase 7: Polish + Deploy

 27. Add animations (document upload, processing steps, verdict reveal)
 28. Add bilingual text throughout (Arabic primary, English secondary)
 29. Responsive design for tablet
 30. Deploy to Vercel

 ---
 Verification / Testing Plan

 1. Form Validation: Fill form with test data, verify all fields save correctly, cascading dropdowns work
 2. Document Upload: Upload PDF + JPG + PNG, verify base64 conversion and preview rendering
 3. API Connection: Enter OpenRouter API key, test connection to all 4 models
 4. AI Pipeline: Submit a test application with sample documents, verify:
   - All 3 readers fire in parallel
   - Each returns valid structured JSON
   - Judge receives all 3 results and produces verdict
   - Live pipeline UI updates step by step
 5. Scoring: Test scenarios from PRD:
   - Perfect match -> score >= 80 -> APPROVE
   - Grade mismatch -> REVIEW
   - Outstanding obligations -> REJECT
 6. RTL: Verify entire UI renders correctly in Arabic RTL
 7. Settings: Change system prompt, verify it persists in localStorage and gets used in next API call
 8. Seat Availability: Verify school capacity check against mock data

 ---
 Future Roadmap (Phase 2+)

 ┌──────────┬───────────────────────────┬───────────────────────────────────────────────────────────────────────────┐    
 │ Priority │          Feature          │                                   Notes                                   │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ High     │ Dedicated OCR model       │ Add specialized Arabic/multilingual OCR layer for higher accuracy and     │    
 │          │                           │ data privacy (process locally before sending to cloud AI)                 │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ High     │ CXMS Messaging System     │ Second module: AI answers school requests based on ADEK policies. Two     │    
 │          │                           │ types: "Approval" requests and "Answer" requests                          │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Medium   │ Real eSIS integration     │ Connect to ADEK's student information system API - auto-fill student data │    
 │          │                           │  from eSIS number                                                         │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Medium   │ Database                  │ Replace localStorage with persistent storage, enable audit trail          │    
 │          │ (Supabase/Postgres)       │                                                                           │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Medium   │ User authentication       │ Role-based access: school staff (submit), ADEK staff (review), admin      │    
 │          │                           │ (settings)                                                                │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Medium   │ PDF report generation     │ Downloadable verification report with all checks and verdict              │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Low      │ Batch processing          │ Bulk upload during peak enrollment (Sep-Dec)                              │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Low      │ Pin-on-map address        │ Replace text address field with map-based location picker                 │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Low      │ School capacity dashboard │ Visual dashboard showing seat availability across all schools             │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Future   │ Policy chatbot (RAG)      │ AI chatbot trained on ADEK policies for staff questions                   │    
 ├──────────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────────┤    
 │ Future   │ Predictive enrollment     │ Forecast enrollment demand per school/region                              │    
 │          │ analytics                 │                                                                           │    
 └──────────┴───────────────────────────┴───────────────────────────────────────────────────────