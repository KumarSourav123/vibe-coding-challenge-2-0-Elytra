/**
 * Client for the match endpoints (docs/API_CONTRACTS.md §2.17–2.21).
 * Every function resolves to an apiRequest result.
 */
import { apiRequest } from "@/frontend/utils/apiClient";

export const MATCHES_ENDPOINT = "/api/matches";

const matchPath = (id) => `${MATCHES_ENDPOINT}/${encodeURIComponent(id)}`;

/** Players present in a CLOSED session on that date and sport. */
export function getEligiblePlayers({ date, sport }) {
  return apiRequest(`${MATCHES_ENDPOINT}/eligible-players`, { query: { date, sport } });
}

/** @param {{ sport?: string }} [filters] */
export function listMatches(filters = {}) {
  return apiRequest(MATCHES_ENDPOINT, { query: filters });
}

export function getMatch(id) {
  return apiRequest(matchPath(id));
}

/** @param {{ date: string, sport: string, opponent: string, participants: Array<{ playerId: string, score: number }> }} input */
export function createMatch(input) {
  return apiRequest(MATCHES_ENDPOINT, { method: "POST", body: input });
}

/** @param {{ opponent?: string, participants?: Array<{ playerId: string, score: number }> }} updates */
export function updateMatch(id, updates) {
  return apiRequest(matchPath(id), { method: "PATCH", body: updates });
}
