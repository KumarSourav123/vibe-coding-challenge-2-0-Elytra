import { createSessionToken, registerUser, toSessionPayload } from "@/backend/services/authService";
import { successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateRegisterInput } from "@/backend/validators/authValidator";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/authToken";

export const runtime = "nodejs";

/** POST /api/auth/register - join an academy with its join code, see docs/API_CONTRACTS.md §2.5 */
export async function POST(request) {
  try {
    const input = validateRegisterInput(await readJsonBody(request));
    const user = await registerUser(input);
    const token = await createSessionToken(user);

    const response = successResponse(await toSessionPayload(user), "Account created", 201);
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
