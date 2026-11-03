import mongoose from "mongoose";
import { Match, Player, Session } from "@/backend/models";
import { ATTENDANCE_STATUS, READINESS_RULES, SESSION_STATUS } from "@/backend/utils/constants";
import { formatDateOnly } from "@/backend/utils/date";
import { AppError } from "@/backend/utils/errors";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Readiness and performance (docs/API_CONTRACTS.md §2.22-2.26), always
 * computed from real records:
 *   READY = attendance >= 75% of CLOSED sessions AND matches played >= 2
 */

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Pure readiness rule. The threshold uses integer arithmetic, so exactly 75%
 * qualifies and floating-point rounding can never flip the result.
 */
export function computeReadiness({ completedSessions = 0, sessionsAttended = 0, matchesPlayed = 0 }) {
  const { MIN_ATTENDANCE_PERCENT, MIN_MATCHES_PLAYED } = READINESS_RULES;
  const meetsAttendance = completedSessions > 0 && sessionsAttended * 100 >= MIN_ATTENDANCE_PERCENT * completedSessions;

  return {
    isReady: meetsAttendance && matchesPlayed >= MIN_MATCHES_PLAYED,
    attendancePercent: completedSessions ? round1((sessionsAttended / completedSessions) * 100) : 0,
    sessionsAttended,
    completedSessions,
    matchesPlayed,
    requirements: { minAttendancePercent: MIN_ATTENDANCE_PERCENT, minMatchesPlayed: MIN_MATCHES_PLAYED },
  };
}

export function computePerformance({ matchesPlayed = 0, totalScore = 0, bestScore = null }) {
  return {
    totalScore,
    averageScore: matchesPlayed ? round1(totalScore / matchesPlayed) : null,
    bestScore: matchesPlayed ? bestScore : null,
  };
}

/**
 * Attendance and match stats per player, from two aggregations.
 * @param {mongoose.Types.ObjectId[]} playerIds limit to these (academy-scoped) players
 * @returns {Promise<Map<string, { completedSessions, sessionsAttended, matchesPlayed, totalScore, bestScore }>>}
 */
async function aggregateStats(playerIds) {
  const onlyPlayers = (path) => [{ $match: { [path]: { $in: playerIds } } }];

  const [attendance, matches] = await Promise.all([
    Session.aggregate([
      { $match: { status: SESSION_STATUS.CLOSED } },
      { $unwind: "$attendance" },
      ...onlyPlayers("attendance.player"),
      {
        $group: {
          _id: "$attendance.player",
          completedSessions: { $sum: 1 },
          sessionsAttended: { $sum: { $cond: [{ $eq: ["$attendance.status", ATTENDANCE_STATUS.PRESENT] }, 1, 0] } },
        },
      },
    ]),
    Match.aggregate([
      { $unwind: "$participants" },
      ...onlyPlayers("participants.player"),
      {
        $group: {
          _id: "$participants.player",
          matchesPlayed: { $sum: 1 },
          totalScore: { $sum: "$participants.score" },
          bestScore: { $max: "$participants.score" },
        },
      },
    ]),
  ]);

  const stats = new Map();
  const entry = (id) => {
    const key = String(id);
    if (!stats.has(key)) {
      stats.set(key, { completedSessions: 0, sessionsAttended: 0, matchesPlayed: 0, totalScore: 0, bestScore: null });
    }
    return stats.get(key);
  };
  for (const row of attendance) Object.assign(entry(row._id), { completedSessions: row.completedSessions, sessionsAttended: row.sessionsAttended });
  for (const row of matches) Object.assign(entry(row._id), { matchesPlayed: row.matchesPlayed, totalScore: row.totalScore, bestScore: row.bestScore });
  return stats;
}

const EMPTY_STATS = { completedSessions: 0, sessionsAttended: 0, matchesPlayed: 0, totalScore: 0, bestScore: null };

const toProfile = (player) => ({
  id: String(player._id),
  name: player.name,
  age: player.age,
  sport: player.sport,
  isActive: player.isActive,
});

function toReadinessRow(player, stats = EMPTY_STATS) {
  return { player: toProfile(player), readiness: computeReadiness(stats), performance: computePerformance(stats) };
}

/** Readiness rows for players matching `query`, sorted by name. */
async function readinessRows(query) {
  await connectToDatabase();
  const players = await Player.find(query).sort({ name: 1, _id: 1 });
  const stats = await aggregateStats(players.map((p) => p._id));
  return players.map((p) => toReadinessRow(p, stats.get(String(p._id))));
}

/** Coach dashboard (§2.22). `summary` covers the whole academy, before filters. */
export async function getCoachDashboard({ sport, readiness }, academyId) {
  const all = await readinessRows({ academy: academyId });
  const players = all.filter(
    (row) =>
      (!sport || row.player.sport === sport) &&
      (readiness === "all" || row.readiness.isReady === (readiness === "ready"))
  );
  const ready = all.filter((row) => row.readiness.isReady).length;
  return { summary: { players: all.length, ready, notReady: all.length - ready }, players };
}

/** Scout list (§2.25): the academy's active AND Ready players only. */
export async function listReadyPlayers({ sport }, academyId) {
  const rows = await readinessRows({ academy: academyId, isActive: true, ...(sport && { sport }) });
  return rows.filter((row) => row.readiness.isReady);
}

/** Full performance detail for one player (§ "Player performance detail"). */
async function buildPerformanceDetail(player) {
  const [stats, sessions, matches] = await Promise.all([
    aggregateStats([player._id]),
    Session.find({ academy: player.academy, status: SESSION_STATUS.CLOSED, "attendance.player": player._id }).sort({ date: -1, closedAt: -1 }),
    Match.find({ academy: player.academy, "participants.player": player._id }).sort({ date: -1, createdAt: -1 }),
  ]);

  const id = String(player._id);
  return {
    ...toReadinessRow(player, stats.get(id)),
    profile: toProfile(player),
    attendance: sessions.map((s) => ({
      sessionId: String(s._id),
      date: formatDateOnly(s.date),
      sport: s.sport,
      status: s.attendance.find((r) => String(r.player) === id).status,
    })),
    matches: matches.map((m) => ({
      matchId: String(m._id),
      date: formatDateOnly(m.date),
      sport: m.sport,
      opponent: m.opponent,
      score: m.participants.find((p) => String(p.player) === id).score,
    })),
  };
}

function toDetailResponse({ profile, readiness, performance, attendance, matches }) {
  return { profile, readiness, performance, attendance, matches };
}

const notFound = () => new AppError("Player not found", 404, [{ code: "NOT_FOUND", message: "Player not found" }]);

async function findPlayer(id, academyId) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Validation failed", 400, [{ field: "id", code: "INVALID_ID", message: "Invalid player id" }]);
  }
  await connectToDatabase();
  return Player.findOne({ _id: id, academy: academyId });
}

/** Coach view of any player in the academy (§2.23). */
export async function getPlayerPerformance(id, academyId) {
  const player = await findPlayer(id, academyId);
  if (!player) throw notFound();
  return toDetailResponse(await buildPerformanceDetail(player));
}

/** Signed-in player's own dashboard (§2.24). Identity comes only from the session user. */
export async function getOwnDashboard(user) {
  await connectToDatabase();
  const player = user.player ? await Player.findOne({ _id: user.player, academy: user.academy }) : null;
  if (!player) {
    throw new AppError("No player profile is linked to this account", 404, [
      { code: "NO_PLAYER_PROFILE", message: "No player profile is linked to this account" },
    ]);
  }
  return toDetailResponse(await buildPerformanceDetail(player));
}

/**
 * Scout view of one player (§2.26). Not active or not Ready is reported
 * exactly like an unknown id, so scouts can't learn they exist.
 */
export async function getReadyPlayerForScout(id, academyId) {
  const player = await findPlayer(id, academyId);
  if (!player || !player.isActive) throw notFound();
  const detail = await buildPerformanceDetail(player);
  if (!detail.readiness.isReady) throw notFound();
  return toDetailResponse(detail);
}
