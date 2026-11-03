import { requireRole } from "@/backend/middleware/auth";
import { getReadyPlayerForScout } from "@/backend/services/readinessService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/scout/players/:id - Ready players only, see docs/API_CONTRACTS.md §2.26 */
export async function GET(request, { params }) {
  try {
    const scout = await requireRole(request, ROLES.SCOUT);
    const { id } = await params;
    return successResponse(await getReadyPlayerForScout(id, scout.academy), "Player fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}
