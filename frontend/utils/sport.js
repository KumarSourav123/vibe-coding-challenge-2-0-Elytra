/**
 * Same normalization the server applies to sport names (backend/utils/sport.js),
 * used only for previews such as "3 active players play Cricket".
 * The server remains the source of truth.
 */
export function normalizeSport(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
