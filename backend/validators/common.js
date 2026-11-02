import { AppError } from "@/backend/utils/errors";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/backend/utils/password";

/**
 * Small building blocks shared by request validators. Each `check*` function
 * returns the normalised value, or records a field error and returns undefined.
 * Non-string input is always rejected, which also blocks `{ "$ne": null }`
 * style NoSQL injection.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

export function createValidator() {
  const errors = [];
  return {
    add(field, message) {
      errors.push({ field, code: "INVALID_FIELD", message });
    },
    hasErrors: () => errors.length > 0,
    throwIfErrors() {
      if (errors.length > 0) throw new AppError("Validation failed", 400, errors);
    },
  };
}

export function checkString(v, field, value, { label, min = 1, max }) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return v.add(field, `${label} is required`);
  if (text.length < min) return v.add(field, `${label} must be at least ${min} characters`);
  if (max && text.length > max) return v.add(field, `${label} must be at most ${max} characters`);
  return text;
}

export function checkEmail(v, field, value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!email) return v.add(field, "Email is required");
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return v.add(field, "Email is invalid");
  return email;
}

/** New passwords: 8-128 characters. Not trimmed - spaces are allowed. */
export function checkNewPassword(v, field, value, label = "Password") {
  if (typeof value !== "string" || value.length === 0) return v.add(field, `${label} is required`);
  if (value.length < PASSWORD_MIN_LENGTH) {
    return v.add(field, `${label} must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return v.add(field, `${label} must be at most ${PASSWORD_MAX_LENGTH} characters`);
  }
  return value;
}

export function checkInteger(v, field, value, { label, min, max }) {
  if (typeof value !== "number" || !Number.isInteger(value)) return v.add(field, `${label} must be a whole number`);
  if (value < min || value > max) return v.add(field, `${label} must be between ${min} and ${max}`);
  return value;
}

export function checkBoolean(v, field, value, label) {
  if (typeof value !== "boolean") return v.add(field, `${label} must be true or false`);
  return value;
}
