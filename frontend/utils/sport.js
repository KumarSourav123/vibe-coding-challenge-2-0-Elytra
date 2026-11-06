/**
 * Sport helpers shared by every feature (players, sessions, matches, readiness).
 */

// Suggestions for sport fields. Any sport may be typed; the server normalizes
// the name ("table  TENNIS" -> "Table Tennis").
export const COMMON_SPORTS = [
  "Athletics",
  "Badminton",
  "Basketball",
  "Cricket",
  "Football",
  "Hockey",
  "Kabaddi",
  "Swimming",
  "Table Tennis",
  "Tennis",
  "Volleyball",
];

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

/**
 * Options for a "Sport" filter: "All sports", the common sports, any sport
 * already in use, and the current selection - sorted, without duplicates.
 * @param {string[]} sportsInUse
 * @param {string} [selected]
 */
export function buildSportFilterOptions(sportsInUse = [], selected = "") {
  const names = new Set([...COMMON_SPORTS, ...sportsInUse, ...(selected ? [selected] : [])]);
  return [
    { value: "", label: "All sports" },
    ...[...names].sort().map((name) => ({ value: name, label: name })),
  ];
}
