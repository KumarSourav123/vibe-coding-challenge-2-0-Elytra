/**
 * Canonical sport name: whitespace collapsed, each word Title Case.
 *   " table  TENNIS " -> "Table Tennis"
 * Used as a Mongoose setter on every `sport` field so matching players,
 * sessions and matches by sport is an exact comparison.
 */
export function normalizeSport(value) {
  if (typeof value !== "string") return value;
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
