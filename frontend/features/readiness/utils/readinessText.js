/**
 * Human-readable explanations of a readiness object (docs/API_CONTRACTS.md
 * "Readiness object"). The server decides isReady; this only explains it.
 */

/**
 * Whether the attendance requirement is met, using the same exact integer
 * rule as the server (attended x 100 >= 75 x completed). attendancePercent is
 * rounded for display, so never compare it directly.
 */
export function meetsAttendance(readiness) {
  const { completedSessions, sessionsAttended, requirements } = readiness;
  return completedSessions > 0 && sessionsAttended * 100 >= requirements.minAttendancePercent * completedSessions;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "es"}`;

/** What still stands between the player and Ready. Empty when Ready. */
export function readinessGaps(readiness) {
  if (readiness.isReady) return [];
  const { minAttendancePercent, minMatchesPlayed } = readiness.requirements;
  const gaps = [];

  if (readiness.completedSessions === 0) {
    gaps.push("No completed practice sessions yet");
  } else if (!meetsAttendance(readiness)) {
    gaps.push(`Attendance ${readiness.attendancePercent}% (needs ${minAttendancePercent}%)`);
  }

  const missingMatches = minMatchesPlayed - readiness.matchesPlayed;
  if (missingMatches > 0) gaps.push(`${plural(missingMatches, "more match")} needed`);
  return gaps;
}

/** One-line summary for tables. */
export function readinessSummary(readiness) {
  return readiness.isReady ? "Meets both requirements" : readinessGaps(readiness).join(" · ");
}

/** "43.5" / "—" */
export function formatScore(value) {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}
