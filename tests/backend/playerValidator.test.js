import { describe, expect, it } from "vitest";
import {
  validateCreatePlayerInput,
  validatePlayerQuery,
  validateResetPasswordInput,
  validateUpdatePlayerInput,
} from "@/backend/validators/playerValidator";

function fieldErrors(fn) {
  try {
    fn();
  } catch (error) {
    expect(error.statusCode).toBe(400);
    return Object.fromEntries(error.errors.map((e) => [e.field, e.message]));
  }
  throw new Error("expected validation to fail");
}

const valid = { name: " Asha Rao ", age: 16, sport: " cricket ", email: " Asha@Academy.TEST ", temporaryPassword: "Welcome@123" };

describe("validateCreatePlayerInput", () => {
  it("normalises valid input", () => {
    expect(validateCreatePlayerInput(valid)).toEqual({
      name: "Asha Rao",
      age: 16,
      sport: "Cricket",
      email: "asha@academy.test",
      temporaryPassword: "Welcome@123",
    });
  });

  it("requires every field", () => {
    expect(Object.keys(fieldErrors(() => validateCreatePlayerInput({}))).sort()).toEqual([
      "age",
      "email",
      "name",
      "sport",
      "temporaryPassword",
    ]);
  });

  it("rejects bad values", () => {
    const errors = fieldErrors(() =>
      validateCreatePlayerInput({ ...valid, name: "A", age: "16", email: "nope", temporaryPassword: "short" })
    );
    expect(errors).toEqual({
      name: "Name must be at least 2 characters",
      age: "Age must be a whole number",
      email: "Email is invalid",
      temporaryPassword: "Temporary password must be at least 8 characters",
    });
  });

  it("enforces the age range and integer ages", () => {
    expect(fieldErrors(() => validateCreatePlayerInput({ ...valid, age: 4 })).age).toBe("Age must be between 5 and 60");
    expect(fieldErrors(() => validateCreatePlayerInput({ ...valid, age: 61 })).age).toBe("Age must be between 5 and 60");
    expect(fieldErrors(() => validateCreatePlayerInput({ ...valid, age: 16.5 })).age).toBe("Age must be a whole number");
  });
});

describe("validateUpdatePlayerInput", () => {
  it("returns only provided fields, normalised", () => {
    expect(validateUpdatePlayerInput({ sport: "football", isActive: false, role: "COACH" })).toEqual({
      sport: "Football",
      isActive: false,
    });
  });

  it("rejects an empty update", () => {
    expect(fieldErrors(() => validateUpdatePlayerInput({ unknown: 1 })).body).toMatch(/at least one/);
  });

  it("validates provided fields", () => {
    expect(fieldErrors(() => validateUpdatePlayerInput({ isActive: "no", age: 100 }))).toEqual({
      age: "Age must be between 5 and 60",
      isActive: "isActive must be true or false",
    });
  });
});

describe("validateResetPasswordInput", () => {
  it("requires 8+ characters", () => {
    expect(validateResetPasswordInput({ temporaryPassword: "Reset@5678" })).toEqual({ temporaryPassword: "Reset@5678" });
    expect(fieldErrors(() => validateResetPasswordInput({})).temporaryPassword).toMatch(/required/);
  });
});

describe("validatePlayerQuery", () => {
  const query = (qs) => validatePlayerQuery(new URLSearchParams(qs));

  it("defaults to all players with no filters", () => {
    expect(query("")).toEqual({ status: "all", search: "", sport: null });
  });

  it("normalises sport and trims search", () => {
    expect(query("sport=table%20tennis&search=%20asha%20&status=active")).toEqual({
      status: "active",
      search: "asha",
      sport: "Table Tennis",
    });
  });

  it("rejects an unknown status and an overlong search", () => {
    expect(fieldErrors(() => query("status=retired")).status).toBeDefined();
    expect(fieldErrors(() => query(`search=${"a".repeat(101)}`)).search).toBeDefined();
  });
});
