import { PASSWORD_MAX_LENGTH } from "@/backend/utils/password";
import { checkEmail, checkNewPassword, checkString, createValidator } from "./common";

const PERSON_NAME = { label: "Name", min: 2, max: 100 };
const ACADEMY_NAME = { label: "Academy name", min: 2, max: 100 };

/**
 * Validate the POST /api/auth/login body.
 * Login does not apply the new-password length rule, so older accounts can still sign in.
 * @returns {{ email: string, password: string }}
 */
export function validateLoginInput(body) {
  const v = createValidator();
  const email = checkEmail(v, "email", body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!password) {
    v.add("password", "Password is required");
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    v.add("password", `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
  }

  v.throwIfErrors();
  return { email, password };
}

/**
 * POST /api/auth/register - join an academy (docs/API_CONTRACTS.md §2.5).
 * The join code decides the role, so no role is accepted from the client.
 */
export function validateRegisterInput(body) {
  const v = createValidator();
  const joinCode = typeof body.joinCode === "string" ? body.joinCode.trim() : "";
  if (!joinCode) v.add("joinCode", "Join code is required");
  const input = {
    joinCode,
    name: checkString(v, "name", body.name, PERSON_NAME),
    email: checkEmail(v, "email", body.email),
    password: checkNewPassword(v, "password", body.password),
  };
  v.throwIfErrors();
  return input;
}

/** POST /api/auth/register-academy - create an academy and its Head Coach (§2.5a). */
export function validateRegisterAcademyInput(body) {
  const v = createValidator();
  const input = {
    academyName: checkString(v, "academyName", body.academyName, ACADEMY_NAME),
    name: checkString(v, "name", body.name, PERSON_NAME),
    email: checkEmail(v, "email", body.email),
    password: checkNewPassword(v, "password", body.password),
  };
  v.throwIfErrors();
  return input;
}

/** Validate the POST /api/auth/change-password body. */
export function validateChangePasswordInput(body) {
  const v = createValidator();
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  if (!currentPassword) v.add("currentPassword", "Current password is required");

  const newPassword = checkNewPassword(v, "newPassword", body.newPassword, "New password");
  if (newPassword && currentPassword && newPassword === currentPassword) {
    v.add("newPassword", "New password must be different from the current password");
  }

  v.throwIfErrors();
  return { currentPassword, newPassword };
}
