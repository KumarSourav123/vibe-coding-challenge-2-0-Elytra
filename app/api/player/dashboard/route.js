import { requireRole } from "@/backend/middleware/auth";
import { getOwnDashboard } from "@/backend/services/readinessService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/player/dashboard - see docs/API_CONTRACTS.md §2.24
 * Takes no parameters: the player is always the signed-in user's own profile.
 */
export async function GET(request) {
  try {
    const user = await requireRole(request, ROLES.PLAYER);
    return successResponse(await getOwnDashboard(user), "Dashboard fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}
