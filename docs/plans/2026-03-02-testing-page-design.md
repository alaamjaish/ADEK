# Testing Page Design - Model Extraction Quality Testing

**Date:** 2026-03-02
**Status:** Approved
**Approach:** Standalone page (Approach 1)

## Purpose

Test the raw extraction ability of AI models by sending documents with ZERO pre-filled form data. Compare all 4 models side by side to determine which models best extract student data from Arabic/English educational documents.

## Key Decisions

- **Route:** `/testing` (new standalone page)
- **All 4 models are readers** - no judge role on this page
- **Same prompt for all 4 models** - fair comparison
- **Slightly guided prompt** - lists expected fields but provides no values
- **Results layout:** 4 columns side by side (comparison table)
- **Always parallel processing** - all models run simultaneously

## Page Layout

Two-panel layout:

### Left Panel (~30% width) - Input

1. **File Upload Area**
   - Same document types as main page: Emirates ID, Transfer Certificate, Previous Year Certificate, Passport, Proof of No ID
   - Same base64 encoding
   - No minimum file count (any number accepted for testing)

2. **Template Bar**
   - Save/load document sets for fast re-testing
   - Stores: document base64, filenames, types
   - Separate localStorage key: `adek-verify-test-templates`
   - Same UX as main page template bar

3. **Run Test Button**
   - Sends all files to all 4 models simultaneously
   - Disabled if no files uploaded or no API key
   - Progress badges per model below button (idle/running/complete/error)

### Right Panel (~70% width) - Results

4-column comparison table:

| Field | Model 1 | Model 2 | Model 3 | Model 4 |
|-------|---------|---------|---------|---------|
| Student Name (Arabic) | ... | ... | ... | ... |
| Student Name (English) | ... | ... | ... | ... |
| Nationality | ... | ... | ... | ... |
| Date of Birth | ... | ... | ... | ... |
| Grade Completed | ... | ... | ... | ... |
| Pass/Fail | ... | ... | ... | ... |
| School Name | ... | ... | ... | ... |
| Transfer Status | ... | ... | ... | ... |
| Outstanding Obligations | ... | ... | ... | ... |
| Emirates ID Number | ... | ... | ... | ... |
| Official Stamp | ... | ... | ... | ... |
| Signature | ... | ... | ... | ... |
| Document Dates | ... | ... | ... | ... |
| Flags/Anomalies | ... | ... | ... | ... |
| **Confidence** | HIGH/MED/LOW | ... | ... | ... |

**Column headers:** Model name + status badge + confidence with color coding (green=high, yellow=medium, red=low)

## Prompt Design

Single extraction prompt for all 4 models. No form data context:

> "You are a document analysis expert. Extract the following fields from the provided documents. Return JSON with these exact keys: student_name_arabic, student_name_english, nationality, date_of_birth, grade_completed, pass_fail, school_name, transfer_clearance, outstanding_obligations, emirates_id_number, has_official_stamp, has_signature, document_dates, flags. Also provide an overall confidence level (high/medium/low)."

## Data Flow

```
Files uploaded -> "Run Test" clicked
  -> For each of 4 models (parallel):
      -> Build message: [system prompt] + [document files as base64]
      -> Call OpenRouter API (reader function, no form data)
      -> Parse JSON response
      -> Update comparison table column
  -> All complete -> full table visible
```

## Files to Create/Modify

### New Files
- `src/app/testing/page.tsx` - Testing page route
- `src/components/testing/TestingUpload.tsx` - Left panel (upload + templates + run)
- `src/components/testing/TestingResults.tsx` - Right panel (comparison table)
- `src/components/testing/TestTemplateBar.tsx` - Template management for test files
- `src/hooks/useTestProcessing.ts` - Hook for running all 4 models as readers
- `src/lib/ai/test-reader.ts` - Modified reader that accepts no form data

### Modified Files
- `src/components/layout/Header.tsx` - Add "Testing" nav link
- `src/lib/storage.ts` - Add test template storage functions
- `src/lib/data/types.ts` - Add TestTemplate, TestResult types

## Reused from Existing Code
- `src/lib/ai/openrouter.ts` - API client (unchanged)
- `src/components/sender/DocumentUpload.tsx` - Can reference for file upload patterns
- `src/lib/storage.ts` - Pattern for template storage
