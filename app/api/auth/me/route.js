import { requireAuth } from "@/backend/middleware/auth";
import { toSessionPayload } from "@/backend/services/authService";
import { successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/authToken";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/auth/me - see docs/API_CONTRACTS.md §2.4 */
export async function GET(request) {
  try {
    const user = await requireAuth(request, { allowPasswordChangeRequired: true });
    return successResponse(await toSessionPayload(user), "Authenticated");
  } catch (error) {
    const response = handleRouteError(error);
    // Drop a cookie that no longer maps to a valid session.
    if (response.status === 401 && request.cookies.has(SESSION_COOKIE_NAME)) {
      response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
    }
    return response;
  }
}
