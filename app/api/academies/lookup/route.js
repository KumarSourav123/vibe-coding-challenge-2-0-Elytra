import { lookupJoinCode } from "@/backend/services/academyService";
import { successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/academies/lookup?code= - public join-code preview, see docs/API_CONTRACTS.md §2.5b */
export async function GET(request) {
  try {
    return successResponse(await lookupJoinCode(request.nextUrl.searchParams.get("code") ?? ""), "Join code found");
  } catch (error) {
    return handleRouteError(error);
  }
}
