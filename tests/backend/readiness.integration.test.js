import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAcademy } from "@/backend/services/academyService";
import { GET as coachDashboardRoute } from "@/app/api/coach/dashboard/route";
import { GET as playerDashboardRoute } from "@/app/api/player/dashboard/route";
import { GET as performanceRoute } from "@/app/api/players/[id]/performance/route";
import { GET as getPlayerRoute } from "@/app/api/players/[id]/route";
import { GET as scoutPlayerRoute } from "@/app/api/scout/players/[id]/route";
import { GET as scoutListRoute } from "@/app/api/scout/players/route";
import { Match, Player, Session } from "@/backend/models";
import { ROLES } from "@/backend/utils/constants";
import { parseDateOnly } from "@/backend/utils/date";
import { createUser, loginAs, startTestDatabase, stopTestDatabase } from "../helpers/db";
import { makeRequest } from "../helpers/requests";

const PASSWORD = "readiness-pass-1";
const ctx = (id) => ({ params: Promise.resolve({ id }) });
const id = (doc) => String(doc._id);

/*
 * Scenario (all Cricket):
 *              d1  d2  d3  d4 | open d5 | matches        | attendance | ready?
 *   Rhea        P   P   P   A |    A    | m1 10, m2 30   | 3/4 = 75%  | READY (exactly 75%, 2 matches)
 *   Leo         P   P   A   - |    -    | m1 20, m2 40   | 2/3 = 66.7 | not ready (attendance)
 *   Omar        P   P   P   A |    -    | m1 5           | 3/4 = 75%  | not ready (1 match)
 *   Ina*        P   P   P   A |    -    | m1 7,  m2 9    | 3/4 = 75%  | ready but INACTIVE -> hidden from scouts
 *   Nova        -   -   -   - |    -    | -              | 0          | not ready (no sessions)
 * The open session d5 (Rhea absent) must NOT lower Rhea's attendance.
 */
describe("readiness API (real records)", () => {
  let mongo;
  let academy;
  const p = {};
  const cookie = {};

  const get = (route, path, who, params) => route(makeRequest(path, { cookie: who }), params);
  const json = async (res) => (await res.json()).data;

  beforeAll(async () => {
    mongo = await startTestDatabase("sports-academy-readiness-test");
    academy = await createAcademy("Test Academy");

    for (const [key, name, extra] of [
      ["rhea", "Rhea Ready", {}],
      ["leo", "Leo Low", {}],
      ["omar", "Omar One", {}],
      ["ina", "Ina Inactive", { isActive: false }],
      ["nova", "Nova New", {}],
    ]) {
      p[key] = await Player.create({ academy: academy._id, name, age: 17, sport: "Cricket", ...extra });
    }

    const day = (n) => parseDateOnly(`2026-11-0${n}`);
    const closed = (n, marks) =>
      Session.create({ academy: academy._id,
        date: day(n),
        sport: "Cricket",
        status: "CLOSED",
        closedAt: new Date(),
        attendance: marks.map(([player, status]) => ({ player: player._id, status })),
      });
    await closed(1, [[p.rhea, "PRESENT"], [p.leo, "PRESENT"], [p.omar, "PRESENT"], [p.ina, "PRESENT"]]);
    await closed(2, [[p.rhea, "PRESENT"], [p.leo, "PRESENT"], [p.omar, "PRESENT"], [p.ina, "PRESENT"]]);
    await closed(3, [[p.rhea, "PRESENT"], [p.leo, "ABSENT"], [p.omar, "PRESENT"], [p.ina, "PRESENT"]]);
    await closed(4, [[p.rhea, "ABSENT"], [p.omar, "ABSENT"], [p.ina, "ABSENT"]]);
    await Session.create({ academy: academy._id, date: day(5), sport: "Cricket", status: "OPEN", attendance: [{ player: p.rhea._id, status: "ABSENT" }] });

    const match = (n, opponent, scores) =>
      Match.create({ academy: academy._id,
        date: day(n),
        sport: "Cricket",
        opponent,
        participants: scores.map(([player, score]) => ({ player: player._id, score })),
      });
    await match(1, "City XI", [[p.rhea, 10], [p.leo, 20], [p.omar, 5], [p.ina, 7]]);
    await match(2, "Town XI", [[p.rhea, 30], [p.leo, 40], [p.ina, 9]]);

    const accounts = [
      ["coach", { role: ROLES.COACH }],
      ["scout", { role: ROLES.SCOUT }],
      ["rhea", { role: ROLES.PLAYER, player: p.rhea._id }],
      ["leo", { role: ROLES.PLAYER, player: p.leo._id }],
      ["orphan", { role: ROLES.PLAYER }],
    ];
    for (const [key, fields] of accounts) {
      const email = `${key}@academy.test`;
      await createUser({ academy: academy._id, name: key, email, password: PASSWORD, ...fields });
      cookie[key] = (await loginAs(email, PASSWORD)).cookie;
    }
  });

  afterAll(() => stopTestDatabase(mongo));

  describe("coach dashboard", () => {
    it("computes readiness for every player from real records", async () => {
      const data = await json(await get(coachDashboardRoute, "/api/coach/dashboard", cookie.coach));
      expect(data.summary).toEqual({ players: 5, ready: 2, notReady: 3 });

      const byName = Object.fromEntries(data.players.map((row) => [row.player.name, row]));
      expect(byName["Rhea Ready"].readiness).toMatchObject({
        isReady: true,
        attendancePercent: 75,
        sessionsAttended: 3,
        completedSessions: 4, // the OPEN d5 session is not counted
        matchesPlayed: 2,
      });
      expect(byName["Rhea Ready"].performance).toEqual({ totalScore: 40, averageScore: 20, bestScore: 30 });

      // Compulsory test 8: below 75% is not Ready, despite 2 matches.
      expect(byName["Leo Low"].readiness).toMatchObject({ isReady: false, attendancePercent: 66.7, matchesPlayed: 2 });
      expect(byName["Omar One"].readiness).toMatchObject({ isReady: false, attendancePercent: 75, matchesPlayed: 1 });
      expect(byName["Nova New"].readiness).toMatchObject({ isReady: false, completedSessions: 0, attendancePercent: 0 });
      expect(byName["Ina Inactive"]).toMatchObject({ player: { isActive: false }, readiness: { isReady: true } });
    });

    it("filters by readiness and sport, and validates the filter", async () => {
      const readyNames = (await json(await get(coachDashboardRoute, "/api/coach/dashboard?readiness=ready", cookie.coach))).players.map(
        (r) => r.player.name
      );
      expect(readyNames).toEqual(["Ina Inactive", "Rhea Ready"]);

      const notReady = await json(await get(coachDashboardRoute, "/api/coach/dashboard?readiness=not_ready", cookie.coach));
      expect(notReady.players.map((r) => r.player.name)).toEqual(["Leo Low", "Nova New", "Omar One"]);
      expect(notReady.summary.players).toBe(5); // summary is academy-wide

      const football = await json(await get(coachDashboardRoute, "/api/coach/dashboard?sport=football", cookie.coach));
      expect(football.players).toEqual([]);

      expect((await get(coachDashboardRoute, "/api/coach/dashboard?readiness=maybe", cookie.coach)).status).toBe(400);
    });

    it("gives the coach any player's performance detail", async () => {
      const res = await get(performanceRoute, `/api/players/${id(p.leo)}/performance`, cookie.coach, ctx(id(p.leo)));
      const data = await json(res);
      expect(data.profile.name).toBe("Leo Low");
      expect(data.attendance.map((a) => [a.date, a.status])).toEqual([
        ["2026-11-03", "ABSENT"],
        ["2026-11-02", "PRESENT"],
        ["2026-11-01", "PRESENT"],
      ]);
      expect(data.matches.map((m) => [m.opponent, m.score])).toEqual([
        ["Town XI", 40],
        ["City XI", 20],
      ]);

      const bad = await get(performanceRoute, "/api/players/x/performance", cookie.coach, ctx("bad-id"));
      expect(bad.status).toBe(400);
      const missing = "665000000000000000000999";
      expect((await get(performanceRoute, "/", cookie.coach, ctx(missing))).status).toBe(404);
    });
  });

  describe("scout (compulsory test 10)", () => {
    it("sees only active Ready players, without account data", async () => {
      const data = await json(await get(scoutListRoute, "/api/scout/players", cookie.scout));
      expect(data.count).toBe(1);
      expect(data.players.map((r) => r.player.name)).toEqual(["Rhea Ready"]);
      expect(JSON.stringify(data)).not.toMatch(/email|account|passwordHash/);
    });

    it("gets detail for a Ready player, but 404 for non-Ready or inactive players", async () => {
      const ok = await get(scoutPlayerRoute, "/", cookie.scout, ctx(id(p.rhea)));
      expect(ok.status).toBe(200);
      expect((await json(ok)).readiness.isReady).toBe(true);

      for (const player of [p.leo, p.omar, p.nova, p.ina]) {
        const res = await get(scoutPlayerRoute, "/", cookie.scout, ctx(id(player)));
        expect(res.status).toBe(404);
        expect((await res.json()).errors[0].code).toBe("NOT_FOUND");
      }
    });

    it("filters by sport", async () => {
      const data = await json(await get(scoutListRoute, "/api/scout/players?sport=FOOTBALL", cookie.scout));
      expect(data.players).toEqual([]);
    });

    it("cannot use coach endpoints", async () => {
      expect((await get(coachDashboardRoute, "/api/coach/dashboard", cookie.scout)).status).toBe(403);
      expect((await get(getPlayerRoute, "/", cookie.scout, ctx(id(p.leo)))).status).toBe(403);
    });
  });

  describe("player (compulsory test 11)", () => {
    it("sees only their own profile, attendance, matches and readiness", async () => {
      const data = await json(await get(playerDashboardRoute, "/api/player/dashboard", cookie.rhea));
      expect(data.profile).toMatchObject({ id: id(p.rhea), name: "Rhea Ready" });
      expect(data.readiness).toMatchObject({ isReady: true, attendancePercent: 75, matchesPlayed: 2 });
      expect(data.attendance).toHaveLength(4); // closed sessions only
      expect(data.matches.map((m) => m.score)).toEqual([30, 10]);
      expect(JSON.stringify(data)).not.toMatch(/Leo Low|Omar One|Ina Inactive/);
    });

    it("another player gets their own data from the same URL", async () => {
      const data = await json(await get(playerDashboardRoute, "/api/player/dashboard", cookie.leo));
      expect(data.profile.name).toBe("Leo Low");
      expect(data.readiness.isReady).toBe(false);
    });

    it("ignores any player id supplied by the client", async () => {
      const data = await json(await get(playerDashboardRoute, `/api/player/dashboard?playerId=${id(p.leo)}`, cookie.rhea));
      expect(data.profile.name).toBe("Rhea Ready");
    });

    it("cannot reach another player's data through any other endpoint", async () => {
      const leo = id(p.leo);
      expect((await get(getPlayerRoute, "/", cookie.rhea, ctx(leo))).status).toBe(403);
      expect((await get(performanceRoute, "/", cookie.rhea, ctx(leo))).status).toBe(403);
      expect((await get(scoutPlayerRoute, "/", cookie.rhea, ctx(leo))).status).toBe(403);
      expect((await get(scoutListRoute, "/api/scout/players", cookie.rhea)).status).toBe(403);
      expect((await get(coachDashboardRoute, "/api/coach/dashboard", cookie.rhea)).status).toBe(403);
    });

    it("returns NO_PLAYER_PROFILE for a player account without a linked profile", async () => {
      const res = await get(playerDashboardRoute, "/api/player/dashboard", cookie.orphan);
      expect(res.status).toBe(404);
      expect((await res.json()).errors[0].code).toBe("NO_PLAYER_PROFILE");
    });

    it("coaches and scouts cannot open the player dashboard", async () => {
      expect((await get(playerDashboardRoute, "/api/player/dashboard", cookie.coach)).status).toBe(403);
      expect((await get(playerDashboardRoute, "/api/player/dashboard", cookie.scout)).status).toBe(403);
    });
  });

  it("every readiness endpoint requires authentication", async () => {
    expect((await get(coachDashboardRoute, "/api/coach/dashboard", null)).status).toBe(401);
    expect((await get(playerDashboardRoute, "/api/player/dashboard", null)).status).toBe(401);
    expect((await get(scoutListRoute, "/api/scout/players", null)).status).toBe(401);
    expect((await get(scoutPlayerRoute, "/", null, ctx(id(p.rhea)))).status).toBe(401);
    expect((await get(performanceRoute, "/", null, ctx(id(p.rhea)))).status).toBe(401);
  });

  it("recalculates live: one more match makes Omar Ready", async () => {
    await Match.create({ academy: academy._id,
      date: parseDateOnly("2026-11-02"),
      sport: "Cricket",
      opponent: "Late XI",
      participants: [{ player: p.omar._id, score: 12 }],
    });
    const data = await json(await get(scoutListRoute, "/api/scout/players", cookie.scout));
    expect(data.players.map((r) => r.player.name)).toEqual(["Omar One", "Rhea Ready"]);
  });
});
