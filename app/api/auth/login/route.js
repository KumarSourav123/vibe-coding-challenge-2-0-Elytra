import { authenticate, createSessionToken, toSessionPayload } from "@/backend/services/authService";
import { successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateLoginInput } from "@/backend/validators/authValidator";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/authToken";

export const runtime = "nodejs";

/** POST /api/auth/login - see docs/API_CONTRACTS.md §2.2 */
export async function POST(request) {
  try {
    const credentials = validateLoginInput(await readJsonBody(request));
    const user = await authenticate(credentials);
    const token = await createSessionToken(user);

    const response = successResponse(toSessionPayload(user), "Login successful");
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
