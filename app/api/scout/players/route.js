import { requireRole } from "@/backend/middleware/auth";
import { listReadyPlayers } from "@/backend/services/readinessService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { validateScoutQuery } from "@/backend/validators/readinessValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/scout/players - Ready players only, see docs/API_CONTRACTS.md §2.25 */
export async function GET(request) {
  try {
    const scout = await requireRole(request, ROLES.SCOUT);
    const players = await listReadyPlayers(validateScoutQuery(request.nextUrl.searchParams), scout.academy);
    return successResponse({ players, count: players.length }, "Ready players fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}
