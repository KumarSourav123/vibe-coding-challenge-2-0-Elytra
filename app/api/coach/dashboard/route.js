import { requireRole } from "@/backend/middleware/auth";
import { getCoachDashboard } from "@/backend/services/readinessService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { validateCoachDashboardQuery } from "@/backend/validators/readinessValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/coach/dashboard - see docs/API_CONTRACTS.md §2.22 */
export async function GET(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const query = validateCoachDashboardQuery(request.nextUrl.searchParams);
    return successResponse(await getCoachDashboard(query, coach.academy), "Dashboard fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}
