import { describe, expect, it } from "vitest";
import { isNotFoundResult } from "@/frontend/utils/apiClient";
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
