/**
 * Calendar-day helpers for "YYYY-MM-DD" strings from the API. Formatting uses
 * UTC so a session dated 2026-11-02 shows as 2 Nov in every timezone.
 */

function toUtcDate(dateOnly) {
  return new Date(`${dateOnly}T00:00:00Z`);
}

/** "2026-11-02" -> "Mon, 2 Nov 2026" */
export function formatDayLabel(dateOnly, options = {}) {
  if (!dateOnly) return "";
  return toUtcDate(dateOnly).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  });
}

/** Today in the viewer's local timezone, as "YYYY-MM-DD". */
export function todayDateOnly(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** ISO timestamp -> "2 Nov 2026, 14:05" in the viewer's timezone. */
export function formatTimestamp(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
