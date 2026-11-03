/**
 * Client for the readiness endpoints (docs/API_CONTRACTS.md §2.22–2.26).
 * Every function resolves to an apiRequest result.
 */
import { apiRequest } from "@/frontend/utils/apiClient";

/** @param {{ sport?: string, readiness?: "all"|"ready"|"not_ready" }} [filters] */
export function getCoachDashboard(filters = {}) {
  return apiRequest("/api/coach/dashboard", { query: filters });
}

/** Coach view of one player's performance. */
export function getPlayerPerformance(playerId) {
  return apiRequest(`/api/players/${encodeURIComponent(playerId)}/performance`);
}

/** The signed-in player's own dashboard (no id: the server uses the session). */
export function getPlayerDashboard() {
  return apiRequest("/api/player/dashboard");
}

/** @param {{ sport?: string }} [filters] */
export function listReadyPlayers(filters = {}) {
  return apiRequest("/api/scout/players", { query: filters });
}

export function getReadyPlayer(playerId) {
  return apiRequest(`/api/scout/players/${encodeURIComponent(playerId)}`);
}
