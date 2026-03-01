import { ApplicationFormData, ReaderResult, ValidationCheck } from '../data/types';
import { getSchoolById, getAvailableSeats } from '../data/schools';
import { fuzzyNameMatch, getNameMatchStatus } from './name-matching';

function majorityValue<T>(values: T[]): T {
  const counts = new Map<string, number>();
  values.forEach(v => {
    const key = JSON.stringify(v);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  let maxCount = 0;
  let maxVal = values[0];
  counts.forEach((count, key) => {
    if (count > maxCount) {
      maxCount = count;
      maxVal = JSON.parse(key);
    }
  });
  return maxVal;
}

export function runValidationRules(
  form: ApplicationFormData,
  readerResults: ReaderResult[]
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const validResults = readerResults.filter(r => !r.error);

  // 1. Name Match
  if (validResults.length > 0) {
    const nameScores = validResults.map(r => {
      const arabicMatch = fuzzyNameMatch(form.student.studentNameArabic, r.extracted_data.student_name_arabic);
      const englishMatch = fuzzyNameMatch(form.student.studentNameEnglish, r.extracted_data.student_name_english);
      return Math.max(arabicMatch, englishMatch);
    });
    const avgScore = nameScores.reduce((a, b) => a + b, 0) / nameScores.length;
    const status = getNameMatchStatus(avgScore);
    const passed = status === 'match';

    checks.push({
      rule: 'name_match',
      ruleAr: 'مطابقة الاسم',
      result: passed ? 'pass' : 'fail',
      severity: 'critical',
      details: `Name match score: ${(avgScore * 100).toFixed(0)}% (${status})`,
      detailsAr: `نسبة مطابقة الاسم: ${(avgScore * 100).toFixed(0)}% (${status === 'match' ? 'مطابق' : status === 'partial' ? 'جزئي' : 'غير مطابق'})`,
      points: passed ? 15 : -25,
    });
  }

  // 2. DOB Match
  if (validResults.length > 0) {
    const dobMatches = validResults.map(r => r.extracted_data.date_of_birth === form.student.dateOfBirth);
    const passed = majorityValue(dobMatches);

    checks.push({
      rule: 'dob_match',
      ruleAr: 'مطابقة تاريخ الميلاد',
      result: passed ? 'pass' : 'fail',
      severity: 'critical',
      details: passed ? 'Date of birth matches across documents' : 'Date of birth mismatch detected',
      detailsAr: passed ? 'تاريخ الميلاد متطابق في جميع المستندات' : 'تم اكتشاف عدم تطابق في تاريخ الميلاد',
      points: passed ? 15 : -25,
    });
  }

  // 3. Grade Eligibility
  if (validResults.length > 0) {
    const eligibilities = validResults.map(r => r.cross_validation.grade_eligibility?.status === 'eligible');
    const passed = majorityValue(eligibilities);
    const passStatuses = validResults.map(r => r.extracted_data.pass_fail);
    const studentPassed = majorityValue(passStatuses) === 'pass';

    checks.push({
      rule: 'grade_eligibility',
      ruleAr: 'أهلية الصف',
      result: passed && studentPassed ? 'pass' : 'fail',
      severity: 'critical',
      details: passed && studentPassed
        ? `Student eligible for ${form.admission.targetGrade}`
        : `Student may not be eligible for ${form.admission.targetGrade}`,
      detailsAr: passed && studentPassed
        ? `الطالب مؤهل للصف ${form.admission.targetGrade}`
        : `الطالب قد لا يكون مؤهلاً للصف ${form.admission.targetGrade}`,
      points: passed && studentPassed ? 15 : -25,
    });
  }

  // 4. Transfer Clearance
  if (validResults.length > 0) {
    const clearances = validResults.map(r => r.extracted_data.transfer_clearance);
    const clearance = majorityValue(clearances);
    const passed = clearance === 'clear';

    checks.push({
      rule: 'transfer_clearance',
      ruleAr: 'شهادة الانتقال',
      result: passed ? 'pass' : 'fail',
      severity: 'critical',
      details: passed ? 'Transfer clearance confirmed' : `Transfer status: ${clearance}`,
      detailsAr: passed ? 'تم تأكيد شهادة الانتقال' : `حالة الانتقال: ${clearance === 'pending' ? 'معلق' : 'محظور'}`,
      points: passed ? 15 : -25,
    });
  }

  // 5. Seat Availability
  const gender = form.student.gender as 'male' | 'female';
  if (form.admission.targetSchool && form.admission.targetGrade && gender) {
    const seats = getAvailableSeats(form.admission.targetSchool, form.admission.targetGrade, gender);
    const passed = seats > 0;
    const school = getSchoolById(form.admission.targetSchool);

    checks.push({
      rule: 'seat_availability',
      ruleAr: 'توفر المقاعد',
      result: passed ? 'pass' : 'fail',
      severity: 'critical',
      details: passed
        ? `${seats} seats available at ${school?.nameEn || 'school'} for ${form.admission.targetGrade}`
        : `No seats available at ${school?.nameEn || 'school'} for ${form.admission.targetGrade}`,
      detailsAr: passed
        ? `${seats} مقعد متاح في ${school?.nameAr || 'المدرسة'} للصف ${form.admission.targetGrade}`
        : `لا توجد مقاعد متاحة في ${school?.nameAr || 'المدرسة'} للصف ${form.admission.targetGrade}`,
      points: passed ? 15 : -25,
    });
  }

  // 6. Emirates ID Valid
  if (validResults.length > 0) {
    const idStatuses = validResults.map(r => r.cross_validation.id_verification?.status);
    const status = majorityValue(idStatuses);
    const hasProofNoId = form.documents.some(d => d.type === 'proof_no_id' && d.base64);
    const passed = status === 'match' || hasProofNoId;

    checks.push({
      rule: 'emirates_id_valid',
      ruleAr: 'صلاحية الهوية',
      result: passed ? 'pass' : 'fail',
      severity: 'critical',
      details: passed
        ? (hasProofNoId ? 'Proof of no ID provided' : 'Emirates ID verified')
        : 'Emirates ID verification failed',
      detailsAr: passed
        ? (hasProofNoId ? 'تم تقديم إثبات عدم وجود الهوية' : 'تم التحقق من الهوية الإماراتية')
        : 'فشل التحقق من الهوية الإماراتية',
      points: passed ? 15 : -25,
    });
  }

  // 7. Document Stamps
  if (validResults.length > 0) {
    const stampChecks = validResults.map(r => r.extracted_data.has_official_stamp);
    const hasStamp = majorityValue(stampChecks);

    checks.push({
      rule: 'document_stamps',
      ruleAr: 'الأختام الرسمية',
      result: hasStamp ? 'pass' : 'warning',
      severity: 'warning',
      details: hasStamp ? 'Official stamps detected' : 'Official stamps not clearly detected',
      detailsAr: hasStamp ? 'تم اكتشاف الأختام الرسمية' : 'لم يتم اكتشاف الأختام الرسمية بوضوح',
      points: hasStamp ? 5 : -10,
    });
  }

  // 8. Document Recency
  if (validResults.length > 0) {
    const currentYear = new Date().getFullYear();
    const hasRecentDocs = validResults.some(r => {
      const dates = Object.values(r.extracted_data.document_dates || {});
      return dates.some(d => {
        const year = parseInt(d);
        return year >= currentYear - 1;
      });
    });

    checks.push({
      rule: 'document_recency',
      ruleAr: 'حداثة المستندات',
      result: hasRecentDocs ? 'pass' : 'warning',
      severity: 'warning',
      details: hasRecentDocs ? 'Documents are from current/previous academic year' : 'Document recency could not be confirmed',
      detailsAr: hasRecentDocs ? 'المستندات من العام الدراسي الحالي أو السابق' : 'لم يتم التأكد من حداثة المستندات',
      points: hasRecentDocs ? 5 : -10,
    });
  }

  return checks;
}
