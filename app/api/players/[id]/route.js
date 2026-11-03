import { requireRole } from "@/backend/middleware/auth";
import { getPlayer, updatePlayer } from "@/backend/services/playerService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateUpdatePlayerInput } from "@/backend/validators/playerValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/players/:id - see docs/API_CONTRACTS.md §2.9 */
export async function GET(request, { params }) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const { id } = await params;
    return successResponse({ player: await getPlayer(id, coach.academy) }, "Player fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/players/:id - see docs/API_CONTRACTS.md §2.10 */
export async function PATCH(request, { params }) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const { id } = await params;
    const updates = validateUpdatePlayerInput(await readJsonBody(request));
    return successResponse({ player: await updatePlayer(id, updates, coach.academy) }, "Player updated");
  } catch (error) {
    return handleRouteError(error);
  }
}
