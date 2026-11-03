import { requireRole } from "@/backend/middleware/auth";
import { closeSession } from "@/backend/services/sessionService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";

export const runtime = "nodejs";

/** POST /api/sessions/:id/close - see docs/API_CONTRACTS.md §2.16 */
export async function POST(request, { params }) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const { id } = await params;
    return successResponse({ session: await closeSession(id, coach.academy) }, "Session closed");
  } catch (error) {
    return handleRouteError(error);
  }
}
