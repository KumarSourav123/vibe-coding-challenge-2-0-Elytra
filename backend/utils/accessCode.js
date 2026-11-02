import { createHash, timingSafeEqual } from "node:crypto";
import { ROLES } from "./constants";
import { AppError } from "./errors";

/**
 * Registration access codes for self-registering roles (docs/API_CONTRACTS.md §1.6).
 * A role whose code is unset or too short cannot self-register.
 */
const CODE_ENV_BY_ROLE = {
  [ROLES.COACH]: "COACH_SIGNUP_CODE",
  [ROLES.SCOUT]: "SCOUT_SIGNUP_CODE",
};
const MIN_CODE_LENGTH = 8;

const digest = (value) => createHash("sha256").update(value, "utf8").digest();

/** @throws {AppError} 403 REGISTRATION_DISABLED or INVALID_ACCESS_CODE */
export function verifyAccessCode(role, code) {
  const expected = process.env[CODE_ENV_BY_ROLE[role]];
  if (!expected || expected.length < MIN_CODE_LENGTH) {
    throw new AppError("Registration is not available for this role", 403, [
      { code: "REGISTRATION_DISABLED", message: "Registration is not available for this role" },
    ]);
  }

  // Compare fixed-length digests so the check takes constant time.
  if (!timingSafeEqual(digest(code), digest(expected))) {
    throw new AppError("Invalid access code", 403, [
      { field: "accessCode", code: "INVALID_ACCESS_CODE", message: "Invalid access code" },
    ]);
  }
}
