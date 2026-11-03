import mongoose from "mongoose";
import { normalizeSport } from "@/backend/utils/sport";
import { checkString, createValidator } from "./common";
import { checkDateOnly } from "./sessionValidator";

const SPORT = { label: "Sport", min: 1, max: 50 };
const OPPONENT = { label: "Opponent", min: 1, max: 100 };
const MAX_PARTICIPANTS = 100;
const MAX_SCORE = 100000;

/**
 * participants: 1-100 entries of { playerId, score }, each player once.
 * Shape only - eligibility is checked by the service against the database.
 */
function checkParticipants(v, value) {
  if (!Array.isArray(value) || value.length === 0) return v.add("participants", "Select at least one player");
  if (value.length > MAX_PARTICIPANTS) return v.add("participants", `At most ${MAX_PARTICIPANTS} players per match`);

  const seen = new Set();
  return value.map((entry, index) => {
    const playerId = typeof entry?.playerId === "string" ? entry.playerId : "";
    const score = entry?.score;

    if (!mongoose.isValidObjectId(playerId)) {
      v.add(`participants.${index}.playerId`, "Player id is invalid");
    } else if (seen.has(playerId)) {
      v.add(`participants.${index}.playerId`, "Each player can appear only once per match");
    }
    seen.add(playerId);

    if (typeof score !== "number" || !Number.isFinite(score)) {
      v.add(`participants.${index}.score`, "Score must be a number");
    } else if (score < 0 || score > MAX_SCORE) {
      v.add(`participants.${index}.score`, `Score must be between 0 and ${MAX_SCORE}`);
    }
    return { playerId, score };
  });
}

/** POST /api/matches body (docs/API_CONTRACTS.md §2.18). */
export function validateCreateMatchInput(body) {
  const v = createValidator();
  const input = {
    date: checkDateOnly(v, "date", body.date),
    sport: normalizeSport(checkString(v, "sport", body.sport, SPORT)),
    opponent: checkString(v, "opponent", body.opponent, OPPONENT),
    participants: checkParticipants(v, body.participants),
  };
  v.throwIfErrors();
  return input;
}

/** PATCH /api/matches/:id body (§2.21). Only provided fields are returned. */
export function validateUpdateMatchInput(body) {
  const v = createValidator();
  if (body.opponent === undefined && body.participants === undefined) {
    v.add("body", "Provide opponent and/or participants");
    v.throwIfErrors();
  }

  const updates = {};
  if (body.opponent !== undefined) updates.opponent = checkString(v, "opponent", body.opponent, OPPONENT);
  if (body.participants !== undefined) updates.participants = checkParticipants(v, body.participants);
  v.throwIfErrors();
  return updates;
}

/** GET /api/matches/eligible-players query (§2.17). */
export function validateEligibleQuery(searchParams) {
  const v = createValidator();
  const date = checkDateOnly(v, "date", searchParams.get("date") ?? "");
  const sport = normalizeSport(checkString(v, "sport", searchParams.get("sport") ?? "", SPORT));
  v.throwIfErrors();
  return { date, sport };
}

/** GET /api/matches query (§2.19). */
export function validateMatchQuery(searchParams) {
  const sport = normalizeSport(searchParams.get("sport") || "");
  return { sport: sport || null };
}
