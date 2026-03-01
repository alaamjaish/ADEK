import { ValidationCheck, Verdict } from '../data/types';

const BASE_SCORE = 50;

export function calculateScore(checks: ValidationCheck[]): number {
  const totalPoints = checks.reduce((sum, check) => sum + check.points, 0);
  return Math.max(0, Math.min(100, BASE_SCORE + totalPoints));
}

export function getVerdict(score: number, approveThreshold: number = 80, reviewThreshold: number = 50): Verdict {
  if (score >= approveThreshold) return 'approve';
  if (score >= reviewThreshold) return 'review';
  return 'reject';
}

export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case 'approve': return 'text-green-600';
    case 'review': return 'text-yellow-600';
    case 'reject': return 'text-red-600';
  }
}

export function getVerdictBgColor(verdict: Verdict): string {
  switch (verdict) {
    case 'approve': return 'bg-green-50 border-green-200';
    case 'review': return 'bg-yellow-50 border-yellow-200';
    case 'reject': return 'bg-red-50 border-red-200';
  }
}

export function getVerdictLabel(verdict: Verdict, lang: 'ar' | 'en'): string {
  const labels = {
    approve: { ar: 'موافقة', en: 'APPROVE' },
    review: { ar: 'يحتاج مراجعة', en: 'REVIEW' },
    reject: { ar: 'مرفوض', en: 'REJECT' },
  };
  return labels[verdict][lang];
}

export function getVerdictIcon(verdict: Verdict): string {
  switch (verdict) {
    case 'approve': return '\u2713';
    case 'review': return '\u26A0';
    case 'reject': return '\u2717';
  }
}
