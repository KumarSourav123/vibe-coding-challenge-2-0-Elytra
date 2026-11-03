import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { Academy, User } from "@/backend/models";
import { createAcademy, resolveJoinCode } from "@/backend/services/academyService";
import { ROLES } from "@/backend/utils/constants";
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
 * Join an academy as Coach or Scout (docs/API_CONTRACTS.md §2.5). The join
 * code decides both the academy and the role. It is checked before email
 * uniqueness, so without a valid code nothing is revealed about which emails exist.
 */
export async function registerUser({ joinCode, name, email, password }) {
  const { academy, role } = await resolveJoinCode(joinCode);
  if (await User.exists({ email })) throw duplicateEmail();
  return User.create({ academy: academy._id, name, email, role, passwordHash: await hashPassword(password) });
}

/**
 * Create a new academy and its Head Coach (§2.5a). Anyone may do this: the
 * new academy starts empty and can't see any other academy's data.
 */
export async function registerAcademy({ academyName, name, email, password }) {
  await connectToDatabase();
  if (await User.exists({ email })) throw duplicateEmail();

  const passwordHash = await hashPassword(password);
  const academy = await createAcademy(academyName);
  try {
    const user = await User.create({
      academy: academy._id,
      isHeadCoach: true,
      name,
      email,
      role: ROLES.COACH,
      passwordHash,
    });
    academy.createdBy = user._id;
    await academy.save();
    return user;
  } catch (error) {
    // No orphan academy if the account can't be created (e.g. an email race).
    await Academy.deleteOne({ _id: academy._id });
    if (error?.code === 11000 && error.keyValue?.email) throw duplicateEmail();
    throw error;
  }
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

/** Public shape of the session user (docs/API_CONTRACTS.md §1.5, §1.6). */
export function toSessionUser(user, academy) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    playerId: user.player ? String(user.player) : null,
    mustChangePassword: Boolean(user.mustChangePassword),
    isHeadCoach: Boolean(user.isHeadCoach),
    academy: academy ? { id: String(academy._id), name: academy.name } : null,
  };
}

/** `data` payload shared by login, register, change-password and me. */
export async function toSessionPayload(user) {
  const academy = user.academy ? await Academy.findById(user.academy).select("name") : null;
  return { user: toSessionUser(user, academy), homePath: getHomePathForRole(user.role) };
}
