import { requireRole } from "@/backend/middleware/auth";
import { createMatch, listMatches } from "@/backend/services/matchService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateCreateMatchInput, validateMatchQuery } from "@/backend/validators/matchValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/matches - see docs/API_CONTRACTS.md §2.19 */
export async function GET(request) {
  try {
    await requireRole(request, ROLES.COACH);
    const matches = await listMatches(validateMatchQuery(request.nextUrl.searchParams));
    return successResponse({ matches, count: matches.length }, "Matches fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/matches - see docs/API_CONTRACTS.md §2.18 */
export async function POST(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const input = validateCreateMatchInput(await readJsonBody(request));
    return successResponse({ match: await createMatch(input, coach) }, "Match created", 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
