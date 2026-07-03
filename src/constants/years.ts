export const CANONICAL_YEARS = [1, 2, 3, 4] as const;
export type AcademicYear = typeof CANONICAL_YEARS[number];

export const YEAR_LABELS: Record<AcademicYear, string> = {
  1: '1st Year',
  2: '2nd Year',
  3: '3rd Year',
  4: 'Final Year'
};

export function getYearDisplay(year: number | null | undefined): string {
  if (!year) return 'N/A';
  const y = Number(year) as AcademicYear;
  return YEAR_LABELS[y] || `${year}th Year`;
}

/**
 * Normalizes graduation year string / custom inputs to integers [1, 2, 3, 4]
 */
export function parseYearToNumber(yearVal: any): number | null {
  if (yearVal === null || yearVal === undefined) return null;
  const str = String(yearVal).trim().toLowerCase();
  if (str === '1' || str === '1st' || str.includes('first') || str === '1st year') return 1;
  if (str === '2' || str === '2nd' || str.includes('second') || str === '2nd year') return 2;
  if (str === '3' || str === '3rd' || str.includes('third') || str === '3rd year') return 3;
  if (str === '4' || str === '4th' || str.includes('fourth') || str.includes('final') || str === 'final year') return 4;
  
  const parsed = parseInt(str, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) return parsed;
  return null;
}
