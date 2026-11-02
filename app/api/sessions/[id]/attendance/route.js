import { requireRole } from "@/backend/middleware/auth";
import { markAttendance } from "@/backend/services/sessionService";
import { successResponse } from "@/backend/utils/apiResponse";
import { ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { readJsonBody } from "@/backend/utils/request";
import { validateAttendanceInput } from "@/backend/validators/sessionValidator";

export const runtime = "nodejs";

/** POST /api/sessions/:id/attendance - see docs/API_CONTRACTS.md §2.15 */
export async function POST(request, { params }) {
  try {
    await requireRole(request, ROLES.COACH);
    const { id } = await params;
    const records = validateAttendanceInput(await readJsonBody(request));
    return successResponse({ session: await markAttendance(id, records) }, "Attendance saved");
  } catch (error) {
    return handleRouteError(error);
  }
}
