import { requireRole } from "@/backend/middleware/auth";
import { resetPlayerPassword } from "@/backend/services/playerService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateResetPasswordInput } from "@/backend/validators/playerValidator";

export const runtime = "nodejs";

/** POST /api/players/:id/reset-password - see docs/API_CONTRACTS.md §2.11 */
export async function POST(request, { params }) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const { id } = await params;
    const input = validateResetPasswordInput(await readJsonBody(request));
    return successResponse({ player: await resetPlayerPassword(id, input, coach.academy) }, "Password reset");
  } catch (error) {
    return handleRouteError(error);
  }
}
