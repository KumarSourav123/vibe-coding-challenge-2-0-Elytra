/** "2 present · 1 absent" for closed sessions, "2 of 3 marked" while open. */
export function attendanceLabel({ status, summary }) {
  if (status === "CLOSED") return `${summary.present} present · ${summary.absent} absent`;
  if (summary.eligible === 0) return "No eligible players";
  return `${summary.eligible - summary.unmarked} of ${summary.eligible} marked`;
}
