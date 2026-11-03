import { requireRole } from "@/backend/middleware/auth";
import { getEligiblePlayers } from "@/backend/services/matchService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { validateEligibleQuery } from "@/backend/validators/matchValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/matches/eligible-players?date=&sport= - see docs/API_CONTRACTS.md §2.17 */
export async function GET(request) {
  try {
    await requireRole(request, ROLES.COACH);
    const query = validateEligibleQuery(request.nextUrl.searchParams);
    return successResponse(await getEligiblePlayers(query), "Eligible players fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}
