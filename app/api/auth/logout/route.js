import { successResponse } from "@/backend/utils/apiResponse";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/authToken";

export const runtime = "nodejs";

/** POST /api/auth/logout - see docs/API_CONTRACTS.md §2.3 (idempotent) */
export async function POST() {
  const response = successResponse({}, "Logged out");
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
  return response;
}
