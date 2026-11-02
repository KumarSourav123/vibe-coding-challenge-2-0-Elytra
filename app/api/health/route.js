import { getHealthStatus } from "@/backend/services/healthService";
import { errorResponse, successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";

// Always evaluate at request time; health must never be statically cached.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/health - see docs/API_CONTRACTS.md */
export async function GET() {
  try {
    const health = await getHealthStatus();

    if (!health.healthy) {
      return errorResponse(
        "Service unavailable: database is not connected",
        [{ code: health.database.code, message: health.database.message }],
        503
      );
    }

    return successResponse(
      { app: health.app, database: health.database },
      "Service is healthy"
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
