import { requireRole } from "@/backend/middleware/auth";
import { getSession } from "@/backend/services/sessionService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/sessions/:id - see docs/API_CONTRACTS.md §2.14 */
export async function GET(request, { params }) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const { id } = await params;
    return successResponse({ session: await getSession(id, coach.academy) }, "Session fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}
