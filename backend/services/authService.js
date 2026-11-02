import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { User } from "@/backend/models";
import { verifyAccessCode } from "@/backend/utils/accessCode";
import { AppError } from "@/backend/utils/errors";
import { hashPassword, verifyPassword } from "@/backend/utils/password";
import { signSessionToken } from "@/lib/authToken";
import { connectToDatabase } from "@/lib/mongodb";
import { getHomePathForRole } from "@/lib/roles";

// Hash compared against when the email is unknown, so both failure paths
// cost the same scrypt work and response timing does not reveal valid emails.
let dummyHashPromise = null;
function getDummyHash() {
  dummyHashPromise ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHashPromise;
}

const invalidCredentials = () =>
  new AppError("Invalid email or password", 401, [
    { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
  ]);

/**
 * Verify credentials.
 * @returns {Promise<import("mongoose").Document>} The authenticated user.
 * @throws {AppError} 401 INVALID_CREDENTIALS or 403 ACCOUNT_DISABLED.
 */
export async function authenticate({ email, password }) {
  await connectToDatabase();
  const user = await User.findOne({ email }).select("+passwordHash");

  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !passwordMatches) throw invalidCredentials();

  if (!user.isActive) {
    throw new AppError("This account has been disabled", 403, [
      { code: "ACCOUNT_DISABLED", message: "This account has been disabled" },
    ]);
  }

  return user;
}

/**
 * Register a Coach or Scout (access-code gated; docs/API_CONTRACTS.md §2.5).
 * The access code is checked before email uniqueness, so without a valid
 * code the endpoint reveals nothing about which emails exist.
 */
export async function registerUser({ name, email, password, role, accessCode }) {
  verifyAccessCode(role, accessCode);
  await connectToDatabase();

  if (await User.exists({ email })) throw duplicateEmail();
  return User.create({ name, email, role, passwordHash: await hashPassword(password) });
}

/**
 * Change the user's own password (§2.6). Clears mustChangePassword and bumps
 * sessionVersion, which signs out every other session.
 * @returns {Promise<import("mongoose").Document>} The updated user.
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  await connectToDatabase();
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError("Authentication required", 401, [UNAUTHENTICATED_ERROR]);

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError("Validation failed", 400, [
      { field: "currentPassword", code: "INVALID_CURRENT_PASSWORD", message: "Current password is incorrect" },
    ]);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.sessionVersion += 1;
  await user.save();
  return user;
}

/**
 * Signed session token for the user. Role and status are re-checked from the
 * DB on every API call; `sv` ties the token to the current session version.
 */
export function createSessionToken(user) {
  return signSessionToken({
    sub: String(user._id),
    role: user.role,
    sv: user.sessionVersion ?? 0,
    pwc: Boolean(user.mustChangePassword),
  });
}

export function duplicateEmail() {
  return new AppError("Duplicate record", 409, [
    { field: "email", code: "DUPLICATE", message: "This email is already registered" },
  ]);
}

export const UNAUTHENTICATED_ERROR = Object.freeze({
  code: "UNAUTHENTICATED",
  message: "Please log in to continue",
});

/** Active user by id, or null if missing, malformed or deactivated. */
export async function getActiveUserById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectToDatabase();
  const user = await User.findById(id);
  return user?.isActive ? user : null;
}

/** Public shape of the session user (docs/API_CONTRACTS.md §1.5). */
export function toSessionUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    playerId: user.player ? String(user.player) : null,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

/** `data` payload shared by login and me. */
export function toSessionPayload(user) {
  return { user: toSessionUser(user), homePath: getHomePathForRole(user.role) };
}
