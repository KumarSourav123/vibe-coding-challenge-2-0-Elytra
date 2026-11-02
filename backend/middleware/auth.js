import { getActiveUserById, UNAUTHENTICATED_ERROR } from "@/backend/services/authService";
import { AppError } from "@/backend/utils/errors";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/authToken";

/**
 * Authentication guards for route handlers.
 *
 *   const user = await requireRole(request, ROLES.COACH);
 *
 * Identity always comes from the signed session cookie, and the user (including
 * role and linked player) is reloaded from the database. Never trust user or
 * player IDs sent by the client for access control.
 */

/**
 * The signed-in user, or null when there is no valid session: missing, forged
 * or expired token, unknown or deactivated user, or a session ended by a
 * password change/reset (token `sv` no longer matches).
 * @returns {Promise<import("mongoose").Document | null>}
 */
export async function getSessionUser(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await getActiveUserById(payload.sub);
  if (!user || (payload.sv ?? 0) !== (user.sessionVersion ?? 0)) return null;
  return user;
}

/**
 * @param {Request} request
 * @param {{ allowPasswordChangeRequired?: boolean }} [options] Only the "me" and
 *   change-password routes may set this; everything else is blocked until a
 *   temporary password is changed.
 * @throws {AppError} 401 UNAUTHENTICATED or 403 PASSWORD_CHANGE_REQUIRED
 */
export async function requireAuth(request, { allowPasswordChangeRequired = false } = {}) {
  const user = await getSessionUser(request);
  if (!user) throw new AppError("Authentication required", 401, [UNAUTHENTICATED_ERROR]);

  if (user.mustChangePassword && !allowPasswordChangeRequired) {
    throw new AppError("You must change your password first", 403, [
      { code: "PASSWORD_CHANGE_REQUIRED", message: "Change your temporary password to continue" },
    ]);
  }
  return user;
}

/** @throws {AppError} 401 UNAUTHENTICATED, 403 PASSWORD_CHANGE_REQUIRED or 403 FORBIDDEN */
export async function requireRole(request, ...roles) {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new AppError("You do not have permission to perform this action", 403, [
      { code: "FORBIDDEN", message: `This action requires role: ${roles.join(" or ")}` },
    ]);
  }
  return user;
}
