import { ROLES } from "@/backend/utils/constants";
import { PASSWORD_MAX_LENGTH } from "@/backend/utils/password";
import { checkEmail, checkNewPassword, checkString, createValidator } from "./common";

const SELF_REGISTER_ROLES = [ROLES.COACH, ROLES.SCOUT];

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
 * Validate the POST /api/auth/register body. PLAYER is rejected: players are
 * created by a Coach.
 */
export function validateRegisterInput(body) {
  const v = createValidator();
  const name = checkString(v, "name", body.name, { label: "Name", min: 2, max: 100 });
  const email = checkEmail(v, "email", body.email);
  const password = checkNewPassword(v, "password", body.password);

  const role = SELF_REGISTER_ROLES.includes(body.role) ? body.role : undefined;
  if (!role) v.add("role", "Role must be COACH or SCOUT");

  const accessCode = typeof body.accessCode === "string" ? body.accessCode.trim() : "";
  if (!accessCode) v.add("accessCode", "Access code is required");

  v.throwIfErrors();
  return { name, email, password, role, accessCode };
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
