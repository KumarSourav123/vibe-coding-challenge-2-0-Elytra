import { describe, expect, it } from "vitest";
import { isNotFoundResult } from "@/frontend/utils/apiClient";
import { meetsAttendance } from "@/frontend/features/readiness/utils/readinessText";
import { buildSportFilterOptions, COMMON_SPORTS } from "@/frontend/utils/sport";

describe("buildSportFilterOptions", () => {
  it('starts with "All sports" and lists the common sports, sorted', () => {
    const options = buildSportFilterOptions();
    expect(options[0]).toEqual({ value: "", label: "All sports" });
    expect(options.slice(1).map((o) => o.value)).toEqual([...COMMON_SPORTS].sort());
  });

  it("adds sports in use and the current selection, without duplicates", () => {
    const values = buildSportFilterOptions(["Archery", "Cricket", "Archery"], "Rugby").map((o) => o.value);
    expect(values).toContain("Archery");
    expect(values).toContain("Rugby");
    expect(values.filter((v) => v === "Cricket")).toHaveLength(1);
    expect(values.filter((v) => v === "Archery")).toHaveLength(1);
  });
});

describe("isNotFoundResult", () => {
  it("is true for NOT_FOUND and INVALID_ID only", () => {
    expect(isNotFoundResult({ ok: false, code: "NOT_FOUND" })).toBe(true);
    expect(isNotFoundResult({ ok: false, code: "INVALID_ID" })).toBe(true);
    expect(isNotFoundResult({ ok: false, code: "FORBIDDEN" })).toBe(false);
    expect(isNotFoundResult({ ok: true })).toBe(false);
    expect(isNotFoundResult(null)).toBe(false);
  });
});

describe("meetsAttendance", () => {
  const r = (attended, completed) => ({
    sessionsAttended: attended,
    completedSessions: completed,
    requirements: { minAttendancePercent: 75, minMatchesPlayed: 2 },
  });

  it("uses the exact integer rule: 3/4 meets, 2/3 and 2999/3999 don't, 0/0 doesn't", () => {
    expect(meetsAttendance(r(3, 4))).toBe(true);
    expect(meetsAttendance(r(4, 4))).toBe(true);
    expect(meetsAttendance(r(2, 3))).toBe(false);
    expect(meetsAttendance(r(2999, 3999))).toBe(false);
    expect(meetsAttendance(r(0, 0))).toBe(false);
  });
});
