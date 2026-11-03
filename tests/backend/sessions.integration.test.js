import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAcademy } from "@/backend/services/academyService";
import { POST as attendanceRoute } from "@/app/api/sessions/[id]/attendance/route";
import { POST as closeRoute } from "@/app/api/sessions/[id]/close/route";
import { GET as getSessionRoute } from "@/app/api/sessions/[id]/route";
import { GET as listSessionsRoute, POST as createSessionRoute } from "@/app/api/sessions/route";
import { Player, Session } from "@/backend/models";
import { ROLES } from "@/backend/utils/constants";
import { createUser, loginAs, startTestDatabase, stopTestDatabase } from "../helpers/db";
import { makeRequest } from "../helpers/requests";

const PASSWORD = "coach-password-1";
const ctx = (id) => ({ params: Promise.resolve({ id }) });

// Practice sessions + attendance against a real in-memory MongoDB (docs/API_CONTRACTS.md §2.12-2.16).
describe("sessions API", () => {
  let mongo;
  let academy;
  let coach;
  let scout;
  let playerCookie;
  const cricket = {};

  const create = (body, cookie = coach) => createSessionRoute(makeRequest("/api/sessions", { method: "POST", body, cookie }));
  const list = (qs = "", cookie = coach) => listSessionsRoute(makeRequest(`/api/sessions${qs}`, { cookie }));
  const get = (id, cookie = coach) => getSessionRoute(makeRequest(`/api/sessions/${id}`, { cookie }), ctx(id));
  const mark = (id, records, cookie = coach) =>
    attendanceRoute(makeRequest(`/api/sessions/${id}/attendance`, { method: "POST", body: { records }, cookie }), ctx(id));
  const close = (id, cookie = coach) => closeRoute(makeRequest(`/api/sessions/${id}/close`, { method: "POST", cookie }), ctx(id));

  async function newSession(sport = "Cricket", date = "2026-11-02") {
    const res = await create({ date, sport });
    expect(res.status).toBe(201);
    return (await res.json()).data.session;
  }

  beforeAll(async () => {
    mongo = await startTestDatabase("sports-academy-sessions-test");
    academy = await createAcademy("Test Academy");
    await createUser({ academy: academy._id, name: "Coach", email: "coach@academy.test", password: PASSWORD, role: ROLES.COACH });
    await createUser({ academy: academy._id, name: "Scout", email: "scout@academy.test", password: PASSWORD, role: ROLES.SCOUT });
    coach = (await loginAs("coach@academy.test", PASSWORD)).cookie;
    scout = (await loginAs("scout@academy.test", PASSWORD)).cookie;

    // Compulsory test 1 setup: three cricket players.
    cricket.arjun = await Player.create({ academy: academy._id, name: "Arjun Mehta", age: 16, sport: "Cricket" });
    cricket.bela = await Player.create({ academy: academy._id, name: "Bela Singh", age: 17, sport: "Cricket" });
    cricket.chen = await Player.create({ academy: academy._id, name: "Chen Li", age: 15, sport: "Cricket" });
    cricket.retired = await Player.create({ academy: academy._id, name: "Rita Retired", age: 20, sport: "Cricket", isActive: false });
    cricket.footballer = await Player.create({ academy: academy._id, name: "Fiona Football", age: 16, sport: "Football" });

    const playerUser = await createUser({ academy: academy._id,
      name: "Arjun Mehta",
      email: "arjun@academy.test",
      password: PASSWORD,
      role: ROLES.PLAYER,
      player: cricket.arjun._id,
    });
    playerCookie = (await loginAs(playerUser.email, PASSWORD)).cookie;
  });

  afterAll(() => stopTestDatabase(mongo));

  const id = (player) => String(player._id);

  describe("compulsory tests 2-4", () => {
    it("creates a session, marks two present and one absent, records the absent player correctly", async () => {
      // 2. Create one practice session.
      const session = await newSession();
      expect(session).toMatchObject({ date: "2026-11-02", sport: "Cricket", status: "OPEN", closedAt: null });
      expect(session.summary).toEqual({ eligible: 3, marked: 0, present: 0, absent: 0, unmarked: 3 });

      // 3. Mark two players Present and one Absent.
      const res = await mark(session.id, [
        { playerId: id(cricket.arjun), status: "PRESENT" },
        { playerId: id(cricket.bela), status: "PRESENT" },
        { playerId: id(cricket.chen), status: "ABSENT" },
      ]);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Attendance saved");
      expect(body.data.session.summary).toEqual({ eligible: 3, marked: 3, present: 2, absent: 1, unmarked: 0 });

      // 4. The absent player is recorded correctly - in the API and in MongoDB.
      const chen = body.data.session.roster.find((r) => r.player.id === id(cricket.chen));
      expect(chen).toMatchObject({ status: "ABSENT", eligible: true });
      const stored = await Session.findById(session.id);
      const record = stored.attendance.find((r) => String(r.player) === id(cricket.chen));
      expect(record.status).toBe("ABSENT");
      expect(stored.attendance).toHaveLength(3);

      // Close it - then it can never change again.
      const closed = await close(session.id);
      expect(closed.status).toBe(200);
      const closedSession = (await closed.json()).data.session;
      expect(closedSession.status).toBe("CLOSED");
      expect(closedSession.closedAt).toBeTruthy();
    });
  });

  describe("POST /api/sessions", () => {
    it("normalises sport and date", async () => {
      const session = await newSession(" cricket ", "2026-11-03");
      expect(session.sport).toBe("Cricket");
      expect(session.date).toBe("2026-11-03");
      const stored = await Session.findById(session.id);
      expect(stored.date.toISOString()).toBe("2026-11-03T00:00:00.000Z");
    });

    it("lists eligible players only: active and same sport", async () => {
      const session = await newSession();
      const names = session.roster.map((r) => r.player.name);
      expect(names).toEqual(["Arjun Mehta", "Bela Singh", "Chen Li"]);
      expect(session.roster.every((r) => r.status === null && r.eligible)).toBe(true);
    });

    it("validates input", async () => {
      const res = await create({ date: "2026-02-30", sport: "" });
      expect(res.status).toBe(400);
      expect((await res.json()).errors.map((e) => e.field).sort()).toEqual(["date", "sport"]);
    });

    it("is coach-only", async () => {
      expect((await create({ date: "2026-11-02", sport: "Cricket" }, null)).status).toBe(401);
      expect((await create({ date: "2026-11-02", sport: "Cricket" }, scout)).status).toBe(403);
      expect((await create({ date: "2026-11-02", sport: "Cricket" }, playerCookie)).status).toBe(403);
    });
  });

  describe("POST /api/sessions/:id/attendance", () => {
    it("re-marking a player replaces the status - never duplicates", async () => {
      const session = await newSession();
      await mark(session.id, [{ playerId: id(cricket.arjun), status: "ABSENT" }]);
      const res = await mark(session.id, [{ playerId: id(cricket.arjun), status: "PRESENT" }]);
      const updated = (await res.json()).data.session;
      expect(updated.summary).toMatchObject({ marked: 1, present: 1, absent: 0, unmarked: 2 });

      const stored = await Session.findById(session.id);
      expect(stored.attendance.filter((r) => String(r.player) === id(cricket.arjun))).toHaveLength(1);
    });

    it("leaves records not in the request unchanged", async () => {
      const session = await newSession();
      await mark(session.id, [{ playerId: id(cricket.arjun), status: "PRESENT" }]);
      const res = await mark(session.id, [{ playerId: id(cricket.bela), status: "ABSENT" }]);
      const roster = (await res.json()).data.session.roster;
      expect(roster.find((r) => r.player.id === id(cricket.arjun)).status).toBe("PRESENT");
    });

    it("rejects ineligible players (other sport, inactive, unknown) and saves nothing", async () => {
      const session = await newSession();
      const res = await mark(session.id, [
        { playerId: id(cricket.arjun), status: "PRESENT" },
        { playerId: id(cricket.footballer), status: "PRESENT" },
        { playerId: id(cricket.retired), status: "PRESENT" },
        { playerId: "665000000000000000000999", status: "PRESENT" },
      ]);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.errors.map((e) => [e.field, e.code])).toEqual([
        ["records.1.playerId", "NOT_ELIGIBLE"],
        ["records.2.playerId", "NOT_ELIGIBLE"],
        ["records.3.playerId", "NOT_ELIGIBLE"],
      ]);
      expect(body.errors[0].message).toBe("Fiona Football plays Football, not Cricket");
      expect(body.errors[1].message).toBe("Rita Retired is inactive");
      expect((await Session.findById(session.id)).attendance).toHaveLength(0);
    });

    it("rejects duplicate players within one request", async () => {
      const session = await newSession();
      const res = await mark(session.id, [
        { playerId: id(cricket.arjun), status: "PRESENT" },
        { playerId: id(cricket.arjun), status: "ABSENT" },
      ]);
      expect(res.status).toBe(400);
    });

    it("returns 404 / 400 for unknown or malformed session ids", async () => {
      expect((await mark("665000000000000000000999", [{ playerId: id(cricket.arjun), status: "PRESENT" }])).status).toBe(404);
      expect((await mark("bad-id", [{ playerId: id(cricket.arjun), status: "PRESENT" }])).status).toBe(400);
    });

    it("is coach-only", async () => {
      const session = await newSession();
      const records = [{ playerId: id(cricket.arjun), status: "PRESENT" }];
      expect((await mark(session.id, records, playerCookie)).status).toBe(403);
      expect((await mark(session.id, records, null)).status).toBe(401);
    });
  });

  describe("POST /api/sessions/:id/close", () => {
    it("refuses to close while eligible players are unmarked, listing them", async () => {
      const session = await newSession();
      await mark(session.id, [{ playerId: id(cricket.arjun), status: "PRESENT" }]);
      const res = await close(session.id);
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.errors.map((e) => e.code)).toEqual(["ATTENDANCE_INCOMPLETE", "ATTENDANCE_INCOMPLETE"]);
      expect(body.errors.map((e) => e.playerId).sort()).toEqual([id(cricket.bela), id(cricket.chen)].sort());
      expect((await Session.findById(session.id)).status).toBe("OPEN");
    });

    it("closes a session with no eligible players", async () => {
      const session = await newSession("Archery");
      expect(session.summary.eligible).toBe(0);
      expect((await close(session.id)).status).toBe(200);
    });

    it("makes the session immutable: no attendance edits, no second close (409 SESSION_CLOSED)", async () => {
      const session = await newSession();
      await mark(
        session.id,
        [cricket.arjun, cricket.bela, cricket.chen].map((p) => ({ playerId: id(p), status: "PRESENT" }))
      );
      expect((await close(session.id)).status).toBe(200);

      const edit = await mark(session.id, [{ playerId: id(cricket.chen), status: "ABSENT" }]);
      expect(edit.status).toBe(409);
      expect((await edit.json()).errors[0].code).toBe("SESSION_CLOSED");

      const again = await close(session.id);
      expect(again.status).toBe(409);
      expect((await again.json()).errors[0].code).toBe("SESSION_CLOSED");

      const stored = await Session.findById(session.id);
      expect(stored.attendance.every((r) => r.status === "PRESENT")).toBe(true);
    });

    it("freezes the roster at close: later players don't appear and the summary is unchanged", async () => {
      const session = await newSession("Hockey");
      const hana = await Player.create({ academy: academy._id, name: "Hana Hockey", age: 16, sport: "Hockey" });
      await mark(session.id, [{ playerId: id(hana), status: "ABSENT" }]);
      await close(session.id);

      await Player.create({ academy: academy._id, name: "Late Joiner", age: 16, sport: "Hockey" });
      const detail = (await (await get(session.id)).json()).data.session;
      expect(detail.roster.map((r) => r.player.name)).toEqual(["Hana Hockey"]);
      expect(detail.summary).toEqual({ eligible: 1, marked: 1, present: 0, absent: 1, unmarked: 0 });
    });

    it("keeps the record of a player who became ineligible while the session was open", async () => {
      const session = await newSession("Tennis");
      const tom = await Player.create({ academy: academy._id, name: "Tom Tennis", age: 16, sport: "Tennis" });
      await mark(session.id, [{ playerId: id(tom), status: "PRESENT" }]);
      await Player.updateOne({ _id: tom._id }, { isActive: false });

      const detail = (await (await get(session.id)).json()).data.session;
      expect(detail.roster).toEqual([
        expect.objectContaining({ status: "PRESENT", eligible: false, player: expect.objectContaining({ name: "Tom Tennis" }) }),
      ]);
      // Nobody eligible is unmarked any more, so it can close.
      expect((await close(session.id)).status).toBe(200);
    });
  });

  describe("GET /api/sessions and /api/sessions/:id", () => {
    it("lists newest first with summaries, filterable by status and sport", async () => {
      await newSession("Badminton", "2026-10-01");
      await newSession("Badminton", "2026-12-01");
      const all = (await (await list("?sport=badminton")).json()).data;
      expect(all.sessions.map((s) => s.date)).toEqual(["2026-12-01", "2026-10-01"]);
      expect(all.count).toBe(2);
      expect(all.sessions[0].roster).toBeUndefined();

      const closed = (await (await list("?status=closed")).json()).data.sessions;
      expect(closed.length).toBeGreaterThan(0);
      expect(closed.every((s) => s.status === "CLOSED")).toBe(true);
      const open = (await (await list("?status=open")).json()).data.sessions;
      expect(open.every((s) => s.status === "OPEN")).toBe(true);

      expect((await list("?status=finished")).status).toBe(400);
    });

    it("returns 400 / 404 for bad ids and is coach-only", async () => {
      expect((await get("bad-id")).status).toBe(400);
      expect((await get("665000000000000000000999")).status).toBe(404);
      expect((await list("", scout)).status).toBe(403);
      expect((await list("", playerCookie)).status).toBe(403);
      expect((await list("", null)).status).toBe(401);
    });
  });
});
