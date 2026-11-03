import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as joinCodesRoute } from "@/app/api/academy/join-codes/route";
import { GET as getAcademyRoute, PATCH as patchAcademyRoute } from "@/app/api/academy/route";
import { GET as lookupRoute } from "@/app/api/academies/lookup/route";
import { GET as meRoute } from "@/app/api/auth/me/route";
import { POST as registerAcademyRoute } from "@/app/api/auth/register-academy/route";
import { POST as registerRoute } from "@/app/api/auth/register/route";
import { GET as coachDashboardRoute } from "@/app/api/coach/dashboard/route";
import { GET as eligibleRoute } from "@/app/api/matches/eligible-players/route";
import { GET as getMatchRoute, PATCH as patchMatchRoute } from "@/app/api/matches/[id]/route";
import { GET as listMatchesRoute, POST as createMatchRoute } from "@/app/api/matches/route";
import { GET as performanceRoute } from "@/app/api/players/[id]/performance/route";
import { POST as resetRoute } from "@/app/api/players/[id]/reset-password/route";
import { GET as getPlayerRoute, PATCH as patchPlayerRoute } from "@/app/api/players/[id]/route";
import { GET as listPlayersRoute, POST as createPlayerRoute } from "@/app/api/players/route";
import { GET as scoutPlayerRoute } from "@/app/api/scout/players/[id]/route";
import { GET as scoutListRoute } from "@/app/api/scout/players/route";
import { POST as attendanceRoute } from "@/app/api/sessions/[id]/attendance/route";
import { POST as closeRoute } from "@/app/api/sessions/[id]/close/route";
import { GET as getSessionRoute } from "@/app/api/sessions/[id]/route";
import { GET as listSessionsRoute, POST as createSessionRoute } from "@/app/api/sessions/route";
import { Academy, User } from "@/backend/models";
import { hashPassword } from "@/backend/utils/password";
import { loginAs, startTestDatabase, stopTestDatabase } from "../helpers/db";
import { makeRequest, sessionCookieFrom } from "../helpers/requests";

const DAY = "2026-11-02";
const ctx = (id) => ({ params: Promise.resolve({ id }) });
const PASSWORD = "academy-pass-1";

const get = (route, path, cookie, params) => route(makeRequest(path, { cookie }), params);
const send = (route, path, body, cookie, params, method = "POST") =>
  route(makeRequest(path, { method, body, cookie }), params);
const data = async (res) => (await res.json()).data;

async function createAcademyAccount(academyName, email) {
  const res = await send(registerAcademyRoute, "/api/auth/register-academy", {
    academyName,
    name: `Head of ${academyName}`,
    email,
    password: PASSWORD,
  });
  return { res, cookie: sessionCookieFrom(res), body: await res.clone().json() };
}

async function join(joinCode, name, email) {
  const res = await send(registerRoute, "/api/auth/register", { joinCode, name, email, password: PASSWORD });
  return { res, cookie: sessionCookieFrom(res), body: await res.clone().json() };
}

describe("multi-academy", () => {
  let mongo;
  const A = {};
  const B = {};

  beforeAll(async () => {
    mongo = await startTestDatabase("sports-academy-academy-test");
  });
  afterAll(() => stopTestDatabase(mongo));

  describe("creating an academy", () => {
    it("creates the academy and its Head Coach, signed in, with two join codes", async () => {
      const { res, cookie, body } = await createAcademyAccount("Alpha Academy", "head.a@academy.test");
      expect(res.status).toBe(201);
      expect(body).toMatchObject({
        message: "Academy created",
        data: { homePath: "/coach", user: { role: "COACH", isHeadCoach: true, academy: { name: "Alpha Academy" } } },
      });
      A.head = cookie;

      const overview = await data(await get(getAcademyRoute, "/api/academy", cookie));
      expect(overview.academy.name).toBe("Alpha Academy");
      expect(overview.joinCodes.coach).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(overview.joinCodes.scout).not.toBe(overview.joinCodes.coach);
      expect(overview.members).toEqual([expect.objectContaining({ email: "head.a@academy.test", isHeadCoach: true })]);
      A.codes = overview.joinCodes;

      const b = await createAcademyAccount("Beta Academy", "head.b@academy.test");
      B.head = b.cookie;
      B.codes = (await data(await get(getAcademyRoute, "/api/academy", B.head))).joinCodes;
    });

    it("rejects a duplicate email without leaving an orphan academy", async () => {
      const before = await Academy.countDocuments();
      const { res } = await createAcademyAccount("Gamma Academy", "head.a@academy.test");
      expect(res.status).toBe(409);
      expect(await Academy.countDocuments()).toBe(before);
    });

    it("validates input", async () => {
      const res = await send(registerAcademyRoute, "/api/auth/register-academy", { academyName: "X", email: "bad" });
      expect(res.status).toBe(400);
      expect((await res.json()).errors.map((e) => e.field).sort()).toEqual(["academyName", "email", "name", "password"]);
    });
  });

  describe("joining with a code", () => {
    it("previews a code: academy name and role only", async () => {
      const coach = await data(await get(lookupRoute, `/api/academies/lookup?code=${A.codes.coach}`));
      expect(coach).toEqual({ academy: { name: "Alpha Academy" }, role: "COACH" });
      const scout = await data(await get(lookupRoute, `/api/academies/lookup?code=${A.codes.scout.toLowerCase().replace(/-/g, " ")}`));
      expect(scout.role).toBe("SCOUT");

      const bad = await get(lookupRoute, "/api/academies/lookup?code=AAAA-BBBB-CCCC");
      expect(bad.status).toBe(400);
      expect((await bad.json()).errors[0].code).toBe("INVALID_JOIN_CODE");
    });

    it("the code decides the role and the academy", async () => {
      const coach = await join(A.codes.coach, "Coach Two", "coach2.a@academy.test");
      expect(coach.res.status).toBe(201);
      expect(coach.body.data.user).toMatchObject({ role: "COACH", isHeadCoach: false, academy: { name: "Alpha Academy" } });
      A.coach2 = coach.cookie;

      const scout = await join(A.codes.scout, "Scout A", "scout.a@academy.test");
      expect(scout.body.data).toMatchObject({ homePath: "/scout", user: { role: "SCOUT" } });
      A.scout = scout.cookie;

      B.scout = (await join(B.codes.scout, "Scout B", "scout.b@academy.test")).cookie;
    });

    it("rejects a wrong code (before revealing that an email exists) and duplicate emails", async () => {
      const wrong = await join("ZZZZ-ZZZZ-ZZZZ", "Intruder", "head.a@academy.test");
      expect(wrong.res.status).toBe(400);
      expect((await wrong.res.json()).errors[0]).toMatchObject({ field: "joinCode", code: "INVALID_JOIN_CODE" });

      const dup = await join(A.codes.coach, "Dup", "scout.b@academy.test");
      expect(dup.res.status).toBe(409);
    });
  });

  describe("Head Coach powers", () => {
    it("other coaches see the academy but not the codes, and can't change anything", async () => {
      const overview = await data(await get(getAcademyRoute, "/api/academy", A.coach2));
      expect(overview.joinCodes).toBeNull();
      expect(overview.members.map((m) => m.email).sort()).toEqual(
        ["coach2.a@academy.test", "head.a@academy.test", "scout.a@academy.test"].sort()
      );
      expect((await send(patchAcademyRoute, "/api/academy", { name: "Hijack" }, A.coach2, undefined, "PATCH")).status).toBe(403);
      expect((await send(joinCodesRoute, "/api/academy/join-codes", { role: "COACH" }, A.coach2)).status).toBe(403);
    });

    it("scouts can't open academy settings", async () => {
      expect((await get(getAcademyRoute, "/api/academy", A.scout)).status).toBe(403);
    });

    it("renames the academy", async () => {
      const res = await send(patchAcademyRoute, "/api/academy", { name: "Alpha Cricket Academy" }, A.head, undefined, "PATCH");
      expect(res.status).toBe(200);
      const me = await data(await get(meRoute, "/api/auth/me", A.coach2));
      expect(me.user.academy.name).toBe("Alpha Cricket Academy");
    });

    it("regenerating a code makes the old one stop working immediately", async () => {
      const old = A.codes.scout;
      const res = await send(joinCodesRoute, "/api/academy/join-codes", { role: "SCOUT" }, A.head);
      const { joinCodes } = await data(res);
      expect(joinCodes.scout).not.toBe(old);
      expect(joinCodes.coach).toBe(A.codes.coach);
      A.codes = joinCodes;

      expect((await get(lookupRoute, `/api/academies/lookup?code=${old}`)).status).toBe(400);
      expect((await join(old, "Late", "late@academy.test")).res.status).toBe(400);
      expect((await join(joinCodes.scout, "On Time", "ontime@academy.test")).res.status).toBe(201);
      // People who already joined are unaffected.
      expect((await get(meRoute, "/api/auth/me", A.scout)).status).toBe(200);
    });
  });

  describe("data isolation between academies", () => {
    beforeAll(async () => {
      // Academy A: a player who is Ready (1/1 attendance, 2 matches), a closed session and matches.
      const created = await send(createPlayerRoute, "/api/players", {
        name: "Alpha Star",
        age: 17,
        sport: "Cricket",
        email: "star@alpha.test",
        temporaryPassword: "Welcome@123",
      }, A.head);
      A.player = (await data(created)).player.id;

      const session = (await data(await send(createSessionRoute, "/api/sessions", { date: DAY, sport: "Cricket" }, A.head))).session;
      A.session = session.id;
      await send(attendanceRoute, "/", { records: [{ playerId: A.player, status: "PRESENT" }] }, A.head, ctx(A.session));
      await send(closeRoute, "/", undefined, A.head, ctx(A.session));

      const matchBody = (opponent) => ({ date: DAY, sport: "Cricket", opponent, participants: [{ playerId: A.player, score: 50 }] });
      A.match = (await data(await send(createMatchRoute, "/api/matches", matchBody("City XI"), A.head))).match.id;
      await send(createMatchRoute, "/api/matches", matchBody("Town XI"), A.head);
    });

    it("academy A's own coach and scout see everything as before", async () => {
      expect((await data(await get(listPlayersRoute, "/api/players", A.coach2))).count).toBe(1);
      const scoutList = await data(await get(scoutListRoute, "/api/scout/players", A.scout));
      expect(scoutList.players.map((r) => r.player.name)).toEqual(["Alpha Star"]);
    });

    it("academy B's lists are empty", async () => {
      expect((await data(await get(listPlayersRoute, "/api/players", B.head))).count).toBe(0);
      expect((await data(await get(listSessionsRoute, "/api/sessions", B.head))).count).toBe(0);
      expect((await data(await get(listMatchesRoute, "/api/matches", B.head))).count).toBe(0);
      expect((await data(await get(coachDashboardRoute, "/api/coach/dashboard", B.head))).summary.players).toBe(0);
      expect((await data(await get(scoutListRoute, "/api/scout/players", B.scout))).count).toBe(0);
      const members = (await data(await get(getAcademyRoute, "/api/academy", B.head))).members.map((m) => m.email);
      expect(members.sort()).toEqual(["head.b@academy.test", "scout.b@academy.test"]);
    });

    it("academy B gets 404 for every academy A record, even with the exact id", async () => {
      const notFound = async (res) => {
        expect(res.status).toBe(404);
        expect((await res.json()).errors[0].code).toBe("NOT_FOUND");
      };
      await notFound(await get(getPlayerRoute, "/", B.head, ctx(A.player)));
      await notFound(await send(patchPlayerRoute, "/", { age: 30 }, B.head, ctx(A.player), "PATCH"));
      await notFound(await send(resetRoute, "/", { temporaryPassword: "Hacked@123" }, B.head, ctx(A.player)));
      await notFound(await get(performanceRoute, "/", B.head, ctx(A.player)));
      await notFound(await get(getSessionRoute, "/", B.head, ctx(A.session)));
      await notFound(await send(attendanceRoute, "/", { records: [{ playerId: A.player, status: "ABSENT" }] }, B.head, ctx(A.session)));
      await notFound(await send(closeRoute, "/", undefined, B.head, ctx(A.session)));
      await notFound(await get(getMatchRoute, "/", B.head, ctx(A.match)));
      await notFound(await send(patchMatchRoute, "/", { opponent: "Hacked" }, B.head, ctx(A.match), "PATCH"));
      await notFound(await get(scoutPlayerRoute, "/", B.scout, ctx(A.player)));
    });

    it("academy B can't use academy A's players in its own sessions or matches", async () => {
      const session = (await data(await send(createSessionRoute, "/api/sessions", { date: DAY, sport: "Cricket" }, B.head))).session;
      expect(session.roster).toEqual([]); // A's cricket player is not on B's roster

      const mark = await send(attendanceRoute, "/", { records: [{ playerId: A.player, status: "PRESENT" }] }, B.head, ctx(session.id));
      expect(mark.status).toBe(400);
      expect((await mark.json()).errors[0]).toMatchObject({ code: "NOT_ELIGIBLE", message: "Player not found" });

      const match = await send(createMatchRoute, "/api/matches", {
        date: DAY,
        sport: "Cricket",
        opponent: "X",
        participants: [{ playerId: A.player, score: 1 }],
      }, B.head);
      expect(match.status).toBe(400);
      expect((await match.json()).errors[0].message).toBe("Player not found");

      const eligible = await data(await get(eligibleRoute, `/api/matches/eligible-players?date=${DAY}&sport=Cricket`, B.head));
      expect(eligible).toMatchObject({ sessions: { closed: 0, open: 1 }, players: [] });
    });

    it("academy A's data was not changed by any of B's attempts", async () => {
      const player = (await data(await get(getPlayerRoute, "/", A.head, ctx(A.player)))).player;
      expect(player.age).toBe(17);
      const match = (await data(await get(getMatchRoute, "/", A.head, ctx(A.match)))).match;
      expect(match.opponent).toBe("City XI");
      const session = (await data(await get(getSessionRoute, "/", A.head, ctx(A.session)))).session;
      expect(session.roster[0].status).toBe("PRESENT");
    });
  });

  it("blocks accounts with no academy (pre-migration) instead of leaking data", async () => {
    await User.collection.insertOne({
      name: "Legacy Coach",
      email: "legacy@academy.test",
      passwordHash: await hashPassword(PASSWORD),
      role: "COACH",
      isActive: true,
      sessionVersion: 0,
      mustChangePassword: false,
    });
    const { cookie } = await loginAs("legacy@academy.test", PASSWORD);
    const res = await get(listPlayersRoute, "/api/players", cookie);
    expect(res.status).toBe(403);
    expect((await res.json()).errors[0].code).toBe("ACADEMY_REQUIRED");
  });
});
