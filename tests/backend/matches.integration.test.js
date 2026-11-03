import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as eligibleRoute } from "@/app/api/matches/eligible-players/route";
import { GET as getMatchRoute, PATCH as patchMatchRoute } from "@/app/api/matches/[id]/route";
import { GET as listMatchesRoute, POST as createMatchRoute } from "@/app/api/matches/route";
import { POST as attendanceRoute } from "@/app/api/sessions/[id]/attendance/route";
import { POST as closeRoute } from "@/app/api/sessions/[id]/close/route";
import { POST as createSessionRoute } from "@/app/api/sessions/route";
import { Match, Player } from "@/backend/models";
import { ROLES } from "@/backend/utils/constants";
import { createUser, loginAs, startTestDatabase, stopTestDatabase } from "../helpers/db";
import { makeRequest } from "../helpers/requests";

const PASSWORD = "coach-password-1";
const DAY = "2026-11-02";
const ctx = (id) => ({ params: Promise.resolve({ id }) });
const id = (doc) => String(doc._id);

// Matches + scoring against a real in-memory MongoDB (docs/API_CONTRACTS.md §2.17-2.21).
describe("matches API", () => {
  let mongo;
  let coach;
  let scout;
  let playerCookie;
  const p = {};

  const post = (route, path, body, cookie = coach) => route(makeRequest(path, { method: "POST", body, cookie }));
  const createMatch = (body, cookie = coach) => post(createMatchRoute, "/api/matches", body, cookie);
  const listMatches = (qs = "", cookie = coach) => listMatchesRoute(makeRequest(`/api/matches${qs}`, { cookie }));
  const getMatch = (matchId, cookie = coach) => getMatchRoute(makeRequest(`/api/matches/${matchId}`, { cookie }), ctx(matchId));
  const patchMatch = (matchId, body, cookie = coach) =>
    patchMatchRoute(makeRequest(`/api/matches/${matchId}`, { method: "PATCH", body, cookie }), ctx(matchId));
  const eligible = (qs, cookie = coach) => eligibleRoute(makeRequest(`/api/matches/eligible-players?${qs}`, { cookie }));

  /** Session on date+sport with the given marks; closed unless `close: false`. */
  async function runSession({ date = DAY, sport = "Cricket", marks, close = true }) {
    const res = await post(createSessionRoute, "/api/sessions", { date, sport });
    const session = (await res.json()).data.session;
    const records = marks.map(([player, status]) => ({ playerId: id(player), status }));
    await attendanceRoute(
      makeRequest(`/api/sessions/${session.id}/attendance`, { method: "POST", body: { records }, cookie: coach }),
      ctx(session.id)
    );
    if (close) {
      const closed = await closeRoute(makeRequest(`/api/sessions/${session.id}/close`, { method: "POST", cookie: coach }), ctx(session.id));
      expect(closed.status).toBe(200);
    }
    return session;
  }

  const matchBody = (participants, overrides = {}) => ({
    date: DAY,
    sport: "Cricket",
    opponent: "City XI",
    participants: participants.map(([player, score]) => ({ playerId: id(player), score })),
    ...overrides,
  });

  beforeAll(async () => {
    mongo = await startTestDatabase("sports-academy-matches-test");
    await createUser({ name: "Coach", email: "coach@academy.test", password: PASSWORD, role: ROLES.COACH });
    await createUser({ name: "Scout", email: "scout@academy.test", password: PASSWORD, role: ROLES.SCOUT });
    coach = (await loginAs("coach@academy.test", PASSWORD)).cookie;
    scout = (await loginAs("scout@academy.test", PASSWORD)).cookie;

    // Compulsory tests 1-4 setup: three cricket players; two present, one absent; session closed.
    p.arjun = await Player.create({ name: "Arjun Mehta", age: 16, sport: "Cricket" });
    p.bela = await Player.create({ name: "Bela Singh", age: 17, sport: "Cricket" });
    p.chen = await Player.create({ name: "Chen Li", age: 15, sport: "Cricket" });
    await runSession({ marks: [[p.arjun, "PRESENT"], [p.bela, "PRESENT"], [p.chen, "ABSENT"]] });

    const user = await createUser({
      name: "Arjun Mehta",
      email: "arjun@academy.test",
      password: PASSWORD,
      role: ROLES.PLAYER,
      player: p.arjun._id,
    });
    playerCookie = (await loginAs(user.email, PASSWORD)).cookie;
  });

  afterAll(() => stopTestDatabase(mongo));

  describe("compulsory tests 5-7", () => {
    it("5+6: creates a same-day match with the two present players and their scores", async () => {
      const res = await createMatch(matchBody([[p.arjun, 55], [p.bela, 32]]));
      expect(res.status).toBe(201);
      const { match } = (await res.json()).data;
      expect(match).toMatchObject({ date: DAY, sport: "Cricket", opponent: "City XI" });
      expect(match.participants.map((e) => [e.player.name, e.score])).toEqual([
        ["Arjun Mehta", 55],
        ["Bela Singh", 32],
      ]);
      expect(match.summary).toEqual({
        participants: 2,
        totalScore: 87,
        topScore: 55,
        topScorer: { id: id(p.arjun), name: "Arjun Mehta" },
      });

      const stored = await Match.findById(match.id);
      expect(stored.participants.map((e) => [String(e.player), e.score])).toEqual([
        [id(p.arjun), 55],
        [id(p.bela), 32],
      ]);
    });

    it("7: rejects the absent player - and saves nothing", async () => {
      const before = await Match.countDocuments();
      const res = await createMatch(matchBody([[p.arjun, 40], [p.bela, 20], [p.chen, 10]]));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.errors).toEqual([
        {
          field: "participants.2.playerId",
          code: "NOT_ELIGIBLE",
          playerId: id(p.chen),
          message: `Chen Li was absent on ${DAY}`,
        },
      ]);
      expect(await Match.countDocuments()).toBe(before);
    });
  });

  describe("eligibility", () => {
    it("does not count players present only in an OPEN session", async () => {
      const dara = await Player.create({ name: "Dara Open", age: 16, sport: "Cricket" });
      // Another cricket session on a different day, left open.
      await runSession({
        date: "2026-11-05",
        marks: [[p.arjun, "PRESENT"], [p.bela, "PRESENT"], [p.chen, "PRESENT"], [dara, "PRESENT"]],
        close: false,
      });
      const res = await createMatch(matchBody([[dara, 10]], { date: "2026-11-05" }));
      expect(res.status).toBe(400);
      expect((await res.json()).errors[0].message).toBe(
        "Dara Open was not marked present in a closed Cricket session on 2026-11-05"
      );

      const lookup = (await (await eligible("date=2026-11-05&sport=Cricket")).json()).data;
      expect(lookup).toEqual({ date: "2026-11-05", sport: "Cricket", sessions: { closed: 0, open: 1 }, players: [] });
    });

    it("rejects present players on a different date", async () => {
      const res = await createMatch(matchBody([[p.arjun, 10]], { date: "2026-11-03" }));
      expect(res.status).toBe(400);
      expect((await res.json()).errors[0].code).toBe("NOT_ELIGIBLE");
    });

    it("rejects players of a different sport and inactive players", async () => {
      const fiona = await Player.create({ name: "Fiona Football", age: 16, sport: "Football" });
      const res = await createMatch(matchBody([[fiona, 10]]));
      expect((await res.json()).errors[0].message).toBe("Fiona Football plays Football, not Cricket");

      const gone = await Player.create({ name: "Gita Gone", age: 16, sport: "Hockey" });
      await runSession({ sport: "Hockey", marks: [[gone, "PRESENT"]] });
      await Player.updateOne({ _id: gone._id }, { isActive: false });
      const inactive = await createMatch(matchBody([[gone, 10]], { sport: "Hockey" }));
      expect((await inactive.json()).errors[0].message).toBe("Gita Gone is inactive");
    });

    it("counts a player present in any closed session that day (multiple sessions)", async () => {
      const hari = await Player.create({ name: "Hari Twice", age: 16, sport: "Tennis" });
      await runSession({ sport: "Tennis", marks: [[hari, "ABSENT"]] });
      await runSession({ sport: "Tennis", marks: [[hari, "PRESENT"]] });
      const res = await createMatch(matchBody([[hari, 6]], { sport: "tennis" }));
      expect(res.status).toBe(201);
    });

    it("lists eligible players for a date and sport", async () => {
      const res = await eligible(`date=${DAY}&sport=cricket`);
      expect(res.status).toBe(200);
      const data = (await res.json()).data;
      expect(data.sessions).toEqual({ closed: 1, open: 0 });
      expect(data.players.map((pl) => pl.name)).toEqual(["Arjun Mehta", "Bela Singh"]);
      expect((await eligible("sport=cricket")).status).toBe(400);
    });
  });

  describe("validation and duplicates", () => {
    it("rejects the same player twice in one match", async () => {
      const res = await createMatch(matchBody([[p.arjun, 10], [p.arjun, 20]]));
      expect(res.status).toBe(400);
      expect((await res.json()).errors[0].field).toBe("participants.1.playerId");
    });

    it("rejects invalid scores and missing fields", async () => {
      expect((await createMatch(matchBody([[p.arjun, -5]]))).status).toBe(400);
      expect((await createMatch(matchBody([[p.arjun, "ten"]]))).status).toBe(400);
      expect((await createMatch(matchBody([], { opponent: "" }))).status).toBe(400);
    });
  });

  describe("GET /api/matches and /api/matches/:id", () => {
    it("lists newest first without participant arrays, filterable by sport", async () => {
      await createMatch(matchBody([[p.arjun, 1]], { opponent: "Early XI" }));
      const data = (await (await listMatches("?sport=cricket")).json()).data;
      expect(data.count).toBe(data.matches.length);
      expect(data.matches.every((m) => m.sport === "Cricket" && m.participants === undefined)).toBe(true);
      expect(data.matches[0].summary.topScorer).toBeTruthy();

      const dates = data.matches.map((m) => m.date);
      expect(dates).toEqual([...dates].sort().reverse());
    });

    it("returns one match, or 400 / 404", async () => {
      const { match } = (await (await createMatch(matchBody([[p.bela, 12]]))).json()).data;
      const res = await getMatch(match.id);
      expect(res.status).toBe(200);
      expect((await res.json()).data.match.participants[0].player.name).toBe("Bela Singh");
      expect((await getMatch("bad-id")).status).toBe(400);
      expect((await getMatch("665000000000000000000999")).status).toBe(404);
    });
  });

  describe("PATCH /api/matches/:id", () => {
    it("corrects scores and opponent", async () => {
      const { match } = (await (await createMatch(matchBody([[p.arjun, 10], [p.bela, 20]]))).json()).data;
      const res = await patchMatch(match.id, {
        opponent: "Town FC",
        participants: [
          { playerId: id(p.arjun), score: 30 },
          { playerId: id(p.bela), score: 20 },
        ],
      });
      expect(res.status).toBe(200);
      const updated = (await res.json()).data.match;
      expect(updated.opponent).toBe("Town FC");
      expect(updated.summary).toMatchObject({ totalScore: 50, topScore: 30 });
    });

    it("re-checks eligibility: the absent player still cannot be added", async () => {
      const { match } = (await (await createMatch(matchBody([[p.arjun, 10]]))).json()).data;
      const res = await patchMatch(match.id, {
        participants: [
          { playerId: id(p.arjun), score: 10 },
          { playerId: id(p.chen), score: 5 },
        ],
      });
      expect(res.status).toBe(400);
      expect((await res.json()).errors[0].message).toBe(`Chen Li was absent on ${DAY}`);
      expect((await Match.findById(match.id)).participants).toHaveLength(1);
    });

    it("validates the body and the id", async () => {
      const { match } = (await (await createMatch(matchBody([[p.arjun, 10]]))).json()).data;
      expect((await patchMatch(match.id, {})).status).toBe(400);
      expect((await patchMatch("665000000000000000000999", { opponent: "X" })).status).toBe(404);
    });
  });

  describe("authorization", () => {
    it("is coach-only for every endpoint", async () => {
      const { match } = (await (await createMatch(matchBody([[p.arjun, 10]]))).json()).data;
      for (const cookie of [scout, playerCookie]) {
        expect((await createMatch(matchBody([[p.arjun, 10]]), cookie)).status).toBe(403);
        expect((await listMatches("", cookie)).status).toBe(403);
        expect((await getMatch(match.id, cookie)).status).toBe(403);
        expect((await patchMatch(match.id, { opponent: "X" }, cookie)).status).toBe(403);
        expect((await eligible(`date=${DAY}&sport=Cricket`, cookie)).status).toBe(403);
      }
      expect((await listMatches("", null)).status).toBe(401);
      expect((await createMatch(matchBody([[p.arjun, 10]]), null)).status).toBe(401);
    });
  });
});
