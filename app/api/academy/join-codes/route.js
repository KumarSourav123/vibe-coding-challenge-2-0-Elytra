import { requireHeadCoach } from "@/backend/middleware/auth";
import { regenerateJoinCode } from "@/backend/services/academyService";
import { successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateRegenerateCodeInput } from "@/backend/validators/academyValidator";

export const runtime = "nodejs";

/** POST /api/academy/join-codes - regenerate one code, Head Coach only, see docs/API_CONTRACTS.md §2.5e */
export async function POST(request) {
  try {
    const headCoach = await requireHeadCoach(request);
    const input = validateRegenerateCodeInput(await readJsonBody(request));
    return successResponse(await regenerateJoinCode(headCoach, input), "Join code regenerated");
  } catch (error) {
    return handleRouteError(error);
  }
}
