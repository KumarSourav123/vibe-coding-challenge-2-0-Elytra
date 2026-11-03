import { apiRequest } from "@/frontend/utils/apiClient";

/**
 * Demo codes for judges (docs/API_CONTRACTS.md §2.27).
 * Returns { ok: false, status: 404 } when evaluation mode is off.
 */
export function getEvaluationInfo() {
  return apiRequest("/api/evaluation");
}
