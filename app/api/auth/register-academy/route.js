import { createSessionToken, registerAcademy, toSessionPayload } from "@/backend/services/authService";
import { successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateRegisterAcademyInput } from "@/backend/validators/authValidator";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/authToken";

export const runtime = "nodejs";

/** POST /api/auth/register-academy - new academy + Head Coach, see docs/API_CONTRACTS.md §2.5a */
export async function POST(request) {
  try {
    const input = validateRegisterAcademyInput(await readJsonBody(request));
    const user = await registerAcademy(input);
    const token = await createSessionToken(user);

    const response = successResponse(await toSessionPayload(user), "Academy created", 201);
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
