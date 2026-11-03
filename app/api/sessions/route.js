import { requireRole } from "@/backend/middleware/auth";
import { createSession, listSessions } from "@/backend/services/sessionService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateCreateSessionInput, validateSessionQuery } from "@/backend/validators/sessionValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/sessions - see docs/API_CONTRACTS.md §2.13 */
export async function GET(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const sessions = await listSessions(validateSessionQuery(request.nextUrl.searchParams), coach.academy);
    return successResponse({ sessions, count: sessions.length }, "Sessions fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/sessions - see docs/API_CONTRACTS.md §2.12 */
export async function POST(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const input = validateCreateSessionInput(await readJsonBody(request));
    return successResponse({ session: await createSession(input, coach) }, "Session created", 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
