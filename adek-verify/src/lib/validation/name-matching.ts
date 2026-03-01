// Simple Levenshtein-based fuzzy matching for names
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics
    .replace(/[أإآ]/g, 'ا') // Normalize Alef variants
    .replace(/ة/g, 'ه') // Normalize Ta Marbuta
    .replace(/ى/g, 'ي') // Normalize Alef Maqsura
    .replace(/\s+/g, ' ');
}

export function fuzzyNameMatch(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;

  const n1 = normalize(name1);
  const n2 = normalize(name2);

  if (n1 === n2) return 1.0;

  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshtein(n1, n2);
  return Math.max(0, 1 - distance / maxLen);
}

export function getNameMatchStatus(score: number): 'match' | 'partial' | 'mismatch' {
  if (score >= 0.85) return 'match';
  if (score >= 0.60) return 'partial';
  return 'mismatch';
}
