import { requireRole } from "@/backend/middleware/auth";
import { getMatch, updateMatch } from "@/backend/services/matchService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateUpdateMatchInput } from "@/backend/validators/matchValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/matches/:id - see docs/API_CONTRACTS.md §2.20 */
export async function GET(request, { params }) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const { id } = await params;
    return successResponse({ match: await getMatch(id, coach.academy) }, "Match fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/matches/:id - see docs/API_CONTRACTS.md §2.21 */
export async function PATCH(request, { params }) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const { id } = await params;
    const updates = validateUpdateMatchInput(await readJsonBody(request));
    return successResponse({ match: await updateMatch(id, updates, coach.academy) }, "Match updated");
  } catch (error) {
    return handleRouteError(error);
  }
}
