import mongoose from "mongoose";
import { Match, Player, Session } from "@/backend/models";
import { ATTENDANCE_STATUS, SESSION_STATUS } from "@/backend/utils/constants";
import { formatDateOnly } from "@/backend/utils/date";
import { conflictError, findInAcademyOrThrow } from "@/backend/utils/academyScope";
import { AppError } from "@/backend/utils/errors";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Matches and scores (docs/API_CONTRACTS.md §2.17-2.21). Scoped to one
 * academy: other academies' matches and players look "not found".
 * Callers must already have checked the COACH role.
 *
 * Eligibility (core rule #7, Q3): active, same sport, and PRESENT in at least
 * one CLOSED session on the same date and sport. Open sessions never count.
 */

/**
 * Attendance on a date+sport across sessions. A player counts as present if
 * any CLOSED session has them PRESENT; `absent` holds closed-session absences.
 */
async function getAttendanceForDay(date, sport, academyId) {
  const sessions = await Session.find({ academy: academyId, date, sport }).select("status attendance");
  const closed = sessions.filter((s) => s.status === SESSION_STATUS.CLOSED);

  const present = new Set();
  const absent = new Set();
  for (const session of closed) {
    for (const record of session.attendance) {
      const id = String(record.player);
      if (record.status === ATTENDANCE_STATUS.PRESENT) present.add(id);
      else absent.add(id);
    }
  }
  return { present, absent, closedCount: closed.length, openCount: sessions.length - closed.length };
}

/** Players who may be selected for a match on this date and sport (§2.17). */
export async function getEligiblePlayers({ date, sport }, academyId) {
  await connectToDatabase();
  const day = await getAttendanceForDay(date, sport, academyId);
  const players = day.present.size
    ? await Player.find({ _id: { $in: [...day.present] }, academy: academyId, isActive: true, sport }).sort({ name: 1, _id: 1 })
    : [];

  return {
    date: formatDateOnly(date),
    sport,
    sessions: { closed: day.closedCount, open: day.openCount },
    players: players.map((p) => ({ id: String(p._id), name: p.name, age: p.age })),
  };
}

/**
 * All-or-nothing eligibility check. Returns the Player docs by id, or throws
 * 400 NOT_ELIGIBLE with one entry per offending participant.
 */
async function assertParticipantsEligible(participants, { date, sport, academy }) {
  const day = await getAttendanceForDay(date, sport, academy);
  // Players of other academies are not found, exactly like unknown ids.
  const players = await Player.find({ _id: { $in: participants.map((p) => p.playerId) }, academy });
  const playersById = new Map(players.map((p) => [String(p._id), p]));
  const dateLabel = formatDateOnly(date);

  const errors = [];
  participants.forEach(({ playerId }, index) => {
    const player = playersById.get(playerId);
    let reason = null;
    if (!player) reason = "Player not found";
    else if (!player.isActive) reason = `${player.name} is inactive`;
    else if (player.sport !== sport) reason = `${player.name} plays ${player.sport}, not ${sport}`;
    else if (!day.present.has(playerId)) {
      reason = day.absent.has(playerId)
        ? `${player.name} was absent on ${dateLabel}`
        : `${player.name} was not marked present in a closed ${sport} session on ${dateLabel}`;
    }
    if (reason) errors.push({ field: `participants.${index}.playerId`, code: "NOT_ELIGIBLE", playerId, message: reason });
  });

  if (errors.length) throw new AppError("Some players are not eligible for this match", 400, errors);
  return playersById;
}

const toPlayerSummary = (player, fallbackId) =>
  player
    ? { id: String(player._id), name: player.name, age: player.age, isActive: player.isActive }
    : { id: fallbackId, name: "Unknown player", age: null, isActive: false };

/** Match DTO. Pass `playersById` (Player docs) to resolve names. */
function toMatchDTO(match, playersById, { withParticipants = true } = {}) {
  const participants = match.participants
    .map((p) => ({ player: toPlayerSummary(playersById.get(String(p.player)), String(p.player)), score: p.score }))
    .sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name));

  const top = participants[0];
  const dto = {
    id: String(match._id),
    date: formatDateOnly(match.date),
    sport: match.sport,
    opponent: match.opponent,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    summary: {
      participants: participants.length,
      totalScore: participants.reduce((sum, p) => sum + p.score, 0),
      topScore: top ? top.score : null,
      topScorer: top ? { id: top.player.id, name: top.player.name } : null,
    },
  };
  return withParticipants ? { ...dto, participants } : dto;
}

async function loadPlayersFor(matches) {
  const ids = [...new Set(matches.flatMap((m) => m.participants.map((p) => String(p.player))))];
  const academies = [...new Set(matches.map((m) => String(m.academy)))];
  const players = ids.length ? await Player.find({ _id: { $in: ids }, academy: { $in: academies } }) : [];
  return new Map(players.map((p) => [String(p._id), p]));
}

const findMatchOrThrow = (id, academyId) => findInAcademyOrThrow(Match, id, academyId, "Match");

const toParticipantDocs = (participants) =>
  participants.map(({ playerId, score }) => ({ player: new mongoose.Types.ObjectId(playerId), score }));

export async function createMatch({ date, sport, opponent, participants }, coach) {
  await connectToDatabase();
  const playersById = await assertParticipantsEligible(participants, { date, sport, academy: coach.academy });
  const match = await Match.create({
    academy: coach.academy,
    date,
    sport,
    opponent,
    participants: toParticipantDocs(participants),
    createdBy: coach._id,
  });
  return toMatchDTO(match, playersById);
}

/** @param {{ sport: string|null }} filters */
export async function listMatches({ sport }, academyId) {
  await connectToDatabase();
  const matches = await Match.find({ academy: academyId, ...(sport && { sport }) }).sort({ date: -1, createdAt: -1 });
  const playersById = await loadPlayersFor(matches);
  return matches.map((m) => toMatchDTO(m, playersById, { withParticipants: false }));
}

export async function getMatch(id, academyId) {
  const match = await findMatchOrThrow(id, academyId);
  return toMatchDTO(match, await loadPlayersFor([match]));
}

/**
 * Update opponent and/or replace participants. Eligibility is re-checked
 * against the match's (fixed) date and sport. Compare-and-set on __v.
 */
export async function updateMatch(id, updates, academyId) {
  const match = await findMatchOrThrow(id, academyId);

  const $set = {};
  if (updates.opponent !== undefined) $set.opponent = updates.opponent;
  if (updates.participants !== undefined) {
    await assertParticipantsEligible(updates.participants, { date: match.date, sport: match.sport, academy: match.academy });
    $set.participants = toParticipantDocs(updates.participants);
  }

  const updated = await Match.findOneAndUpdate(
    { _id: match._id, __v: match.__v },
    { $set, $inc: { __v: 1 } },
    { new: true, runValidators: true }
  );
  if (!updated) throw conflictError("Match");
  return toMatchDTO(updated, await loadPlayersFor([updated]));
}
