/**
 * Calendar-day helpers. Session and match dates are days, not instants: they
 * travel as "YYYY-MM-DD" and are stored as UTC midnight, so the same string
 * always maps to the same stored value regardless of server timezone.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-11-02" -> Date(2026-11-02T00:00:00Z), or null if not a real calendar date. */
export function parseDateOnly(value) {
  if (typeof value !== "string") return null;
  const match = DATE_ONLY.exec(value.trim());
  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject rollovers such as 2026-02-30 -> 2026-03-02.
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? date : null;
}

/** Date -> "YYYY-MM-DD" (UTC). */
export function formatDateOnly(date) {
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}
