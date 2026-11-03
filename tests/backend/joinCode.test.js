import { describe, expect, it } from "vitest";
import { generateJoinCode, JOIN_CODE_PATTERN, normalizeJoinCode } from "@/backend/utils/joinCode";
import { validateRegisterAcademyInput, validateRegisterInput } from "@/backend/validators/authValidator";

describe("join codes", () => {
  it("generates XXXX-XXXX-XXXX codes without look-alike characters", () => {
    const codes = Array.from({ length: 200 }, generateJoinCode);
    for (const code of codes) {
      expect(code).toMatch(JOIN_CODE_PATTERN);
      expect(code).not.toMatch(/[01OIL]/);
    }
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("normalises user input (case, spaces, missing dashes)", () => {
    expect(normalizeJoinCode(" k7p2 9qx4-m3t8 ")).toBe("K7P2-9QX4-M3T8");
    expect(normalizeJoinCode("K7P29QX4M3T8")).toBe("K7P2-9QX4-M3T8");
  });

  it("rejects input that can't be a code", () => {
    for (const value of ["", "ABC", "K7P2-9QX4-M3T8-XXXX", null, 42, { code: "x" }]) {
      expect(normalizeJoinCode(value)).toBeNull();
    }
  });
});

function fieldErrors(fn) {
  try {
    fn();
  } catch (error) {
    expect(error.statusCode).toBe(400);
    return Object.fromEntries(error.errors.map((e) => [e.field, e.message]));
  }
  throw new Error("expected validation to fail");
}

describe("registration validators", () => {
  it("join: requires code, name, email and an 8+ character password; ignores any role", () => {
    expect(Object.keys(fieldErrors(() => validateRegisterInput({ role: "COACH" }))).sort()).toEqual([
      "email",
      "joinCode",
      "name",
      "password",
    ]);
    const input = validateRegisterInput({
      joinCode: " K7P2-9QX4-M3T8 ",
      name: "Kim",
      email: "KIM@Academy.test",
      password: "secret123",
      role: "COACH",
    });
    expect(input).toEqual({ joinCode: "K7P2-9QX4-M3T8", name: "Kim", email: "kim@academy.test", password: "secret123" });
  });

  it("create academy: requires the academy name too", () => {
    expect(fieldErrors(() => validateRegisterAcademyInput({ name: "Kim", email: "k@a.co", password: "secret123" }))).toEqual({
      academyName: "Academy name is required",
    });
    expect(fieldErrors(() => validateRegisterAcademyInput({ academyName: "X", name: "Kim", email: "k@a.co", password: "secret123" })).academyName).toMatch(/at least 2/);
  });
});
