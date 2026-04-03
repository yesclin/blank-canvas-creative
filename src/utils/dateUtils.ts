/**
 * Utility functions for handling date-only (civil) dates like birth_date.
 * These functions avoid timezone-related day shifts by never converting
 * "YYYY-MM-DD" strings into Date objects via `new Date(dateString)`,
 * which parses them as UTC midnight and can shift the day in local time.
 */

/**
 * Formats a date-only string (YYYY-MM-DD) to dd/MM/yyyy for display.
 * Does NOT create a Date object, avoiding timezone shifts.
 */
export function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  // Handle both "YYYY-MM-DD" and "YYYY-MM-DDT..." formats
  const parts = dateStr.substring(0, 10).split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

/**
 * Parses a date-only string (YYYY-MM-DD) into { year, month, day } numbers.
 * Returns null if invalid.
 */
export function parseDateParts(dateStr: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.substring(0, 10).split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Calculates age from a date-only string (YYYY-MM-DD) without timezone issues.
 * Uses date part comparison only.
 */
export function calculateAgeFromDateOnly(birthDateStr: string | null | undefined): number | null {
  const birth = parseDateParts(birthDateStr);
  if (!birth) return null;

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1; // 1-based
  const todayDay = now.getDate();

  let age = todayYear - birth.year;
  if (todayMonth < birth.month || (todayMonth === birth.month && todayDay < birth.day)) {
    age--;
  }
  return age;
}
