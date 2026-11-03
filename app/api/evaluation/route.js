import { getEvaluationInfo } from "@/backend/services/evaluationService";
import { successResponse } from "@/backend/utils/apiResponse";
import { handleRouteError } from "@/backend/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/evaluation - demo codes for judges, only when EVALUATION_MODE=true (docs/API_CONTRACTS.md §2.27) */
export async function GET() {
  try {
    return successResponse(await getEvaluationInfo(), "Evaluation info");
  } catch (error) {
    return handleRouteError(error);
  }
}
