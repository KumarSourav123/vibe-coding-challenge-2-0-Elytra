/**
 * Client for the academy endpoints (docs/API_CONTRACTS.md §2.5c–2.5e).
 * Every function resolves to an apiRequest result with { academy, members, joinCodes }.
 */
import { apiRequest } from "@/frontend/utils/apiClient";

export const ACADEMY_ENDPOINT = "/api/academy";

export function getAcademy() {
  return apiRequest(ACADEMY_ENDPOINT);
}

/** Head Coach only. */
export function renameAcademy(name) {
  return apiRequest(ACADEMY_ENDPOINT, { method: "PATCH", body: { name } });
}

/** Head Coach only. The old code stops working immediately. @param {"COACH"|"SCOUT"} role */
export function regenerateJoinCode(role) {
  return apiRequest(`${ACADEMY_ENDPOINT}/join-codes`, { method: "POST", body: { role } });
}
