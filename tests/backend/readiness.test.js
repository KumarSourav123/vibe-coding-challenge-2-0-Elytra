import { describe, expect, it } from "vitest";
import { computePerformance, computeReadiness } from "@/backend/services/readinessService";

const ready = (completedSessions, sessionsAttended, matchesPlayed) =>
  computeReadiness({ completedSessions, sessionsAttended, matchesPlayed }).isReady;

describe("computeReadiness (READY = attendance >= 75% AND matches >= 2)", () => {
  it("compulsory test 8: attendance below 75% is not Ready, even with matches", () => {
    expect(ready(3, 2, 5)).toBe(false); // 66.7%
    expect(ready(100, 74, 2)).toBe(false); // 74%
    expect(ready(20, 14, 2)).toBe(false); // 70%
  });

  it("compulsory test 9: exactly 75% attendance with exactly 2 matches is Ready", () => {
    expect(ready(4, 3, 2)).toBe(true);
    expect(ready(8, 6, 2)).toBe(true);
    expect(ready(100, 75, 2)).toBe(true);
  });

  it("needs at least 2 matches", () => {
    expect(ready(4, 4, 1)).toBe(false);
    expect(ready(4, 4, 0)).toBe(false);
  });

  it("is never Ready without completed sessions", () => {
    expect(ready(0, 0, 10)).toBe(false);
    expect(computeReadiness({ matchesPlayed: 3 }).attendancePercent).toBe(0);
  });

  it("uses exact integer comparison right at the threshold (no float rounding)", () => {
    // 2999/3999 = 74.993...% -> displayed 75 but NOT ready.
    const r = computeReadiness({ completedSessions: 3999, sessionsAttended: 2999, matchesPlayed: 2 });
    expect(r.attendancePercent).toBe(75);
    expect(r.isReady).toBe(false);
  });

  it("returns the documented shape", () => {
    expect(computeReadiness({ completedSessions: 3, sessionsAttended: 2, matchesPlayed: 1 })).toEqual({
      isReady: false,
      attendancePercent: 66.7,
      sessionsAttended: 2,
      completedSessions: 3,
      matchesPlayed: 1,
      requirements: { minAttendancePercent: 75, minMatchesPlayed: 2 },
    });
  });
});

describe("computePerformance", () => {
  it("averages and reports the best score", () => {
    expect(computePerformance({ matchesPlayed: 2, totalScore: 87, bestScore: 55 })).toEqual({
      totalScore: 87,
      averageScore: 43.5,
      bestScore: 55,
    });
  });

  it("uses null with no matches", () => {
    expect(computePerformance({})).toEqual({ totalScore: 0, averageScore: null, bestScore: null });
  });
});
