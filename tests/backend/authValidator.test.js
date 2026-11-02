import { describe, expect, it } from "vitest";
import { AppError } from "@/backend/utils/errors";
import { validateLoginInput } from "@/backend/validators/authValidator";

function errorsFor(body) {
  try {
    validateLoginInput(body);
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    return Object.fromEntries(error.errors.map((e) => [e.field, e.message]));
  }
  throw new Error("expected validation to fail");
}

describe("validateLoginInput", () => {
  it("normalises email to trimmed lower case and keeps the password as-is", () => {
    expect(validateLoginInput({ email: "  Coach@Academy.TEST ", password: " pass word " })).toEqual({
      email: "coach@academy.test",
      password: " pass word ",
    });
  });

  it("requires both fields", () => {
    expect(errorsFor({})).toEqual({ email: "Email is required", password: "Password is required" });
  });

  it("rejects invalid email formats and non-string values", () => {
    expect(errorsFor({ email: "not-an-email", password: "x" }).email).toBe("Email is invalid");
    expect(errorsFor({ email: { $gt: "" }, password: "x" }).email).toBe("Email is required");
    expect(errorsFor({ email: "a@b.co", password: ["x"] }).password).toBe("Password is required");
  });

  it("rejects overly long input", () => {
    expect(errorsFor({ email: `${"a".repeat(250)}@b.co`, password: "x" }).email).toBe("Email is invalid");
    expect(errorsFor({ email: "a@b.co", password: "x".repeat(129) }).password).toMatch(/at most 128/);
  });
});
