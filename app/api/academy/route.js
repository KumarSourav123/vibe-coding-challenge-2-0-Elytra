import { requireHeadCoach, requireRole } from "@/backend/middleware/auth";
import { getAcademyOverview, renameAcademy } from "@/backend/services/academyService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateRenameAcademyInput } from "@/backend/validators/academyValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/academy - see docs/API_CONTRACTS.md §2.5c (join codes for the Head Coach only) */
export async function GET(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    return successResponse(await getAcademyOverview(coach), "Academy fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/academy - rename, Head Coach only, see docs/API_CONTRACTS.md §2.5d */
export async function PATCH(request) {
  try {
    const headCoach = await requireHeadCoach(request);
    const input = validateRenameAcademyInput(await readJsonBody(request));
    return successResponse(await renameAcademy(headCoach, input), "Academy updated");
  } catch (error) {
    return handleRouteError(error);
  }
}
