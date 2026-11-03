import { requireAuth } from "@/backend/middleware/auth";
import { changePassword, createSessionToken, toSessionPayload } from "@/backend/services/authService";
import { successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateChangePasswordInput } from "@/backend/validators/authValidator";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/authToken";

export const runtime = "nodejs";

/** POST /api/auth/change-password - see docs/API_CONTRACTS.md §2.6 */
export async function POST(request) {
  try {
    const sessionUser = await requireAuth(request, { allowPasswordChangeRequired: true });
    const input = validateChangePasswordInput(await readJsonBody(request));
    const user = await changePassword(sessionUser._id, input);

    // All earlier sessions are now invalid; give this browser a fresh one.
    const response = successResponse(await toSessionPayload(user), "Password changed");
    response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(user), getSessionCookieOptions());
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
