/**
 * Client for the player endpoints (docs/API_CONTRACTS.md §2.7–2.11).
 * Every function resolves to an apiRequest result:
 *   { ok: true, data } | { ok: false, code, message, fieldErrors }
 */
import { apiRequest } from "@/frontend/utils/apiClient";

export const PLAYERS_ENDPOINT = "/api/players";

/** @param {{ sport?: string, status?: "all"|"active"|"inactive", search?: string }} [filters] */
export function listPlayers(filters = {}) {
  return apiRequest(PLAYERS_ENDPOINT, { query: filters });
}

export function getPlayer(id) {
  return apiRequest(`${PLAYERS_ENDPOINT}/${encodeURIComponent(id)}`);
}

/** @param {{ name: string, age: number, sport: string, email: string, temporaryPassword: string }} input */
export function createPlayer(input) {
  return apiRequest(PLAYERS_ENDPOINT, { method: "POST", body: input });
}

/** @param {Partial<{ name: string, age: number, sport: string, email: string, isActive: boolean }>} updates */
export function updatePlayer(id, updates) {
  return apiRequest(`${PLAYERS_ENDPOINT}/${encodeURIComponent(id)}`, { method: "PATCH", body: updates });
}

export function resetPlayerPassword(id, temporaryPassword) {
  return apiRequest(`${PLAYERS_ENDPOINT}/${encodeURIComponent(id)}/reset-password`, {
    method: "POST",
    body: { temporaryPassword },
  });
}
