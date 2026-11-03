import { requireRole } from "@/backend/middleware/auth";
import { createPlayer, listPlayers } from "@/backend/services/playerService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateCreatePlayerInput, validatePlayerQuery } from "@/backend/validators/playerValidator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/players - see docs/API_CONTRACTS.md §2.8 */
export async function GET(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const filters = validatePlayerQuery(request.nextUrl.searchParams);
    const players = await listPlayers(filters, coach.academy);
    return successResponse({ players, count: players.length }, "Players fetched");
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/players - see docs/API_CONTRACTS.md §2.7 */
export async function POST(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH);
    const input = validateCreatePlayerInput(await readJsonBody(request));
    const player = await createPlayer(input, coach);
    return successResponse({ player }, "Player created", 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
