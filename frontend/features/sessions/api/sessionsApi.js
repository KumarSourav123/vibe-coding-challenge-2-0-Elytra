/**
 * Client for the practice-session endpoints (docs/API_CONTRACTS.md §2.12–2.16).
 * Every function resolves to an apiRequest result.
 */
import { apiRequest } from "@/frontend/utils/apiClient";

export const SESSIONS_ENDPOINT = "/api/sessions";

const sessionPath = (id, suffix = "") => `${SESSIONS_ENDPOINT}/${encodeURIComponent(id)}${suffix}`;

/** @param {{ status?: "all"|"open"|"closed", sport?: string }} [filters] */
export function listSessions(filters = {}) {
  return apiRequest(SESSIONS_ENDPOINT, { query: filters });
}

export function getSession(id) {
  return apiRequest(sessionPath(id));
}

/** @param {{ date: string, sport: string }} input - date as "YYYY-MM-DD" */
export function createSession(input) {
  return apiRequest(SESSIONS_ENDPOINT, { method: "POST", body: input });
}

/** @param {Array<{ playerId: string, status: "PRESENT"|"ABSENT" }>} records */
export function markAttendance(id, records) {
  return apiRequest(sessionPath(id, "/attendance"), { method: "POST", body: { records } });
}

export function closeSession(id) {
  return apiRequest(sessionPath(id, "/close"), { method: "POST" });
}
