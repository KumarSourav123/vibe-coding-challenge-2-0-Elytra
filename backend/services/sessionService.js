import mongoose from "mongoose";
import { Player, Session } from "@/backend/models";
import { ATTENDANCE_STATUS, SESSION_STATUS } from "@/backend/utils/constants";
import { formatDateOnly } from "@/backend/utils/date";
import { AppError } from "@/backend/utils/errors";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Practice sessions and attendance (docs/API_CONTRACTS.md §2.12-2.16).
 * Callers must already have checked the COACH role.
 *
 * Writes use a compare-and-set on { status: OPEN, __v } so a closed session
 * can never be modified, even by a request that raced the close.
 */

const notFound = () =>
  new AppError("Session not found", 404, [{ code: "NOT_FOUND", message: "Session not found" }]);

const sessionClosed = () =>
  new AppError("This session is closed and can no longer be changed", 409, [
    { code: "SESSION_CLOSED", message: "This session is closed and can no longer be changed" },
  ]);

const conflict = () =>
  new AppError("The session was changed by another request. Reload and try again", 409, [
    { code: "CONFLICT", message: "The session was changed by another request. Reload and try again" },
  ]);

/** Active players whose sport matches - the session's eligible roster (Q1). */
export function findEligiblePlayers(sport) {
  return Player.find({ sport, isActive: true }).sort({ name: 1, _id: 1 });
}

async function findSessionOrThrow(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Validation failed", 400, [{ field: "id", code: "INVALID_ID", message: "Invalid session id" }]);
  }
  await connectToDatabase();
  const session = await Session.findById(id);
  if (!session) throw notFound();
  return session;
}

/**
 * Apply a compare-and-set update to an OPEN session at a known version.
 * Distinguishes "closed meanwhile" (SESSION_CLOSED) from "edited meanwhile" (CONFLICT).
 */
async function updateOpenSession(session, update) {
  const updated = await Session.findOneAndUpdate(
    { _id: session._id, status: SESSION_STATUS.OPEN, __v: session.__v },
    { ...update, $inc: { __v: 1 } },
    { new: true, runValidators: true }
  );
  if (updated) return updated;

  const current = await Session.findById(session._id).select("status");
  if (!current) throw notFound();
  throw current.status === SESSION_STATUS.CLOSED ? sessionClosed() : conflict();
}

/**
 * Counts for a session. For OPEN sessions `eligibleIds` (current eligible
 * roster) drives `eligible`/`unmarked`; CLOSED sessions are frozen at close.
 */
function summarize(session, eligibleIds) {
  const present = session.attendance.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length;
  const marked = session.attendance.length;

  if (session.status === SESSION_STATUS.CLOSED) {
    return { eligible: marked, marked, present, absent: marked - present, unmarked: 0 };
  }

  const markedIds = new Set(session.attendance.map((r) => String(r.player)));
  const unmarked = [...eligibleIds].filter((id) => !markedIds.has(id)).length;
  return { eligible: eligibleIds.size, marked, present, absent: marked - present, unmarked };
}

function toSessionDTO(session, eligibleIds) {
  return {
    id: String(session._id),
    date: formatDateOnly(session.date),
    sport: session.sport,
    status: session.status,
    closedAt: session.closedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    summary: summarize(session, eligibleIds),
  };
}

const toRosterPlayer = (player, fallbackId) =>
  player
    ? { id: String(player._id), name: player.name, age: player.age, isActive: player.isActive }
    : { id: fallbackId, name: "Unknown player", age: null, isActive: false };

/** Session DTO plus the attendance roster (§ "Session object"). */
async function toSessionDetail(session) {
  const isOpen = session.status === SESSION_STATUS.OPEN;
  const records = new Map(session.attendance.map((r) => [String(r.player), r]));

  const eligible = isOpen ? await findEligiblePlayers(session.sport) : [];
  const eligibleIds = new Set(eligible.map((p) => String(p._id)));

  // Players with a record who are not (or no longer) in the eligible list.
  const otherIds = [...records.keys()].filter((id) => !eligibleIds.has(id));
  const others = otherIds.length ? await Player.find({ _id: { $in: otherIds } }) : [];
  const othersById = new Map(others.map((p) => [String(p._id), p]));

  const roster = [
    ...eligible.map((player) => ({ player, id: String(player._id), eligible: true })),
    ...otherIds.map((id) => ({ player: othersById.get(id), id, eligible: !isOpen })),
  ]
    .map(({ player, id, eligible: isEligible }) => {
      const record = records.get(id);
      return {
        player: toRosterPlayer(player, id),
        status: record?.status ?? null,
        markedAt: record?.markedAt ?? null,
        eligible: isEligible,
      };
    })
    .sort((a, b) => a.player.name.localeCompare(b.player.name));

  return { ...toSessionDTO(session, eligibleIds), roster };
}

export async function createSession({ date, sport }, coach) {
  await connectToDatabase();
  const session = await Session.create({ date, sport, createdBy: coach._id });
  return toSessionDetail(session);
}

/** @param {{ status: "open"|"closed"|"all", sport: string|null }} filters */
export async function listSessions({ status, sport }) {
  await connectToDatabase();
  const query = {};
  if (status !== "all") query.status = status === "open" ? SESSION_STATUS.OPEN : SESSION_STATUS.CLOSED;
  if (sport) query.sport = sport;

  const sessions = await Session.find(query).sort({ date: -1, createdAt: -1 });

  // One query for the eligible rosters of every sport with an open session.
  const openSports = [...new Set(sessions.filter((s) => s.status === SESSION_STATUS.OPEN).map((s) => s.sport))];
  const eligibleBySport = new Map(openSports.map((s) => [s, new Set()]));
  if (openSports.length) {
    const players = await Player.find({ sport: { $in: openSports }, isActive: true }).select("_id sport");
    for (const p of players) eligibleBySport.get(p.sport).add(String(p._id));
  }

  return sessions.map((s) => toSessionDTO(s, eligibleBySport.get(s.sport) ?? new Set()));
}

export async function getSession(id) {
  return toSessionDetail(await findSessionOrThrow(id));
}

/**
 * Upsert PRESENT/ABSENT records. All-or-nothing: if any player is not
 * eligible, nothing is saved and every offending entry is reported.
 * @param {Array<{ playerId: string, status: string }>} records
 */
export async function markAttendance(id, records) {
  const session = await findSessionOrThrow(id);
  if (session.status === SESSION_STATUS.CLOSED) throw sessionClosed();

  const players = await Player.find({ _id: { $in: records.map((r) => r.playerId) } });
  const playersById = new Map(players.map((p) => [String(p._id), p]));

  const errors = [];
  records.forEach(({ playerId }, index) => {
    const player = playersById.get(playerId);
    let reason = null;
    if (!player) reason = "Player not found";
    else if (!player.isActive) reason = `${player.name} is inactive`;
    else if (player.sport !== session.sport) reason = `${player.name} plays ${player.sport}, not ${session.sport}`;
    if (reason) errors.push({ field: `records.${index}.playerId`, code: "NOT_ELIGIBLE", playerId, message: reason });
  });
  if (errors.length) throw new AppError("Some players are not eligible for this session", 400, errors);

  const now = new Date();
  const attendance = new Map(
    session.attendance.map((r) => [String(r.player), { player: r.player, status: r.status, markedAt: r.markedAt }])
  );
  for (const { playerId, status } of records) {
    attendance.set(playerId, { player: playersById.get(playerId)._id, status, markedAt: now });
  }

  const updated = await updateOpenSession(session, { $set: { attendance: [...attendance.values()] } });
  return toSessionDetail(updated);
}

/** Close the session once every eligible player is marked. Irreversible. */
export async function closeSession(id) {
  const session = await findSessionOrThrow(id);
  if (session.status === SESSION_STATUS.CLOSED) throw sessionClosed();

  const markedIds = new Set(session.attendance.map((r) => String(r.player)));
  const missing = (await findEligiblePlayers(session.sport)).filter((p) => !markedIds.has(String(p._id)));
  if (missing.length) {
    throw new AppError(
      `Mark every eligible player before closing (${missing.length} unmarked)`,
      409,
      missing.map((p) => ({
        field: "playerId",
        code: "ATTENDANCE_INCOMPLETE",
        playerId: String(p._id),
        message: `${p.name} has not been marked`,
      }))
    );
  }

  const updated = await updateOpenSession(session, {
    $set: { status: SESSION_STATUS.CLOSED, closedAt: new Date() },
  });
  return toSessionDetail(updated);
}
