import { requireRole } from "@/backend/middleware/auth";
import { getPlayerPerformance } from "@/backend/services/readinessService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/players/:id/performance - see docs/API_CONTRACTS.md §2.23 */
export async function GET(request, { params }) {
  try {
    await requireRole(request, ROLES.COACH);
    const { id } = await params;
    return successResponse(await getPlayerPerformance(id), "Performance fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}
