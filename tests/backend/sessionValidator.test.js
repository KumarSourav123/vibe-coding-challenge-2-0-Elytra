import { describe, expect, it } from "vitest";
import { formatDateOnly, parseDateOnly } from "@/backend/utils/date";
import {
  validateAttendanceInput,
  validateCreateSessionInput,
  validateSessionQuery,
} from "@/backend/validators/sessionValidator";

function fieldErrors(fn) {
  try {
    fn();
  } catch (error) {
    expect(error.statusCode).toBe(400);
    return Object.fromEntries(error.errors.map((e) => [e.field, e.message]));
  }
  throw new Error("expected validation to fail");
}

const ID_A = "665000000000000000000101";
const ID_B = "665000000000000000000102";

describe("date helpers", () => {
  it("parses real calendar days to UTC midnight and formats them back", () => {
    const date = parseDateOnly("2026-11-02");
    expect(date.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(formatDateOnly(date)).toBe("2026-11-02");
    expect(parseDateOnly("2028-02-29")).not.toBeNull(); // leap day
  });

  it.each(["2026-02-30", "2026-13-01", "2026-11-2", "02-11-2026", "", "2026-11-02T10:00", null, 20261102])(
    "rejects %j",
    (value) => {
      expect(parseDateOnly(value)).toBeNull();
    }
  );
});

describe("validateCreateSessionInput", () => {
  it("returns a UTC date and normalised sport", () => {
    const input = validateCreateSessionInput({ date: "2026-11-02", sport: " table tennis " });
    expect(input.date.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(input.sport).toBe("Table Tennis");
  });

  it("requires a valid date and a sport", () => {
    expect(fieldErrors(() => validateCreateSessionInput({}))).toEqual({
      date: "Date is required",
      sport: "Sport is required",
    });
    expect(fieldErrors(() => validateCreateSessionInput({ date: "2026-02-30", sport: "x" })).date).toMatch(/valid date/);
    expect(fieldErrors(() => validateCreateSessionInput({ date: "1999-12-31", sport: "x" })).date).toMatch(/between/);
  });
});

describe("validateSessionQuery", () => {
  it("defaults and normalises", () => {
    expect(validateSessionQuery(new URLSearchParams(""))).toEqual({ status: "all", sport: null });
    expect(validateSessionQuery(new URLSearchParams("status=open&sport=CRICKET"))).toEqual({
      status: "open",
      sport: "Cricket",
    });
  });

  it("rejects an unknown status", () => {
    expect(fieldErrors(() => validateSessionQuery(new URLSearchParams("status=done"))).status).toBeDefined();
  });
});

describe("validateAttendanceInput", () => {
  it("accepts valid records", () => {
    expect(
      validateAttendanceInput({
        records: [
          { playerId: ID_A, status: "PRESENT" },
          { playerId: ID_B, status: "ABSENT" },
        ],
      })
    ).toEqual([
      { playerId: ID_A, status: "PRESENT" },
      { playerId: ID_B, status: "ABSENT" },
    ]);
  });

  it("requires a non-empty records array", () => {
    expect(fieldErrors(() => validateAttendanceInput({})).records).toBeDefined();
    expect(fieldErrors(() => validateAttendanceInput({ records: [] })).records).toBeDefined();
    expect(fieldErrors(() => validateAttendanceInput({ records: "x" })).records).toBeDefined();
  });

  it("rejects bad ids, bad statuses and duplicate players in one request", () => {
    const errors = fieldErrors(() =>
      validateAttendanceInput({
        records: [
          { playerId: "nope", status: "PRESENT" },
          { playerId: ID_A, status: "LATE" },
          { playerId: ID_A, status: "ABSENT" },
        ],
      })
    );
    expect(errors).toEqual({
      "records.0.playerId": "Player id is invalid",
      "records.1.status": "Status must be PRESENT or ABSENT",
      "records.2.playerId": "Each player can appear only once per request",
    });
  });
});
