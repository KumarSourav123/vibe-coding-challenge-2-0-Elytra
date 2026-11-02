import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as meRoute } from "@/app/api/auth/me/route";
import { POST as resetPasswordRoute } from "@/app/api/players/[id]/reset-password/route";
import { GET as getPlayerRoute, PATCH as patchPlayerRoute } from "@/app/api/players/[id]/route";
import { GET as listPlayersRoute, POST as createPlayerRoute } from "@/app/api/players/route";
import { Player, User } from "@/backend/models";
import { ROLES } from "@/backend/utils/constants";
import { createUser, loginAs, startTestDatabase, stopTestDatabase } from "../helpers/db";
import { makeRequest } from "../helpers/requests";

const PASSWORD = "coach-password-1";
const ctx = (id) => ({ params: Promise.resolve({ id }) });

// Player management API against a real in-memory MongoDB (docs/API_CONTRACTS.md §2.7-2.11).
describe("players API", () => {
  let mongo;
  let coachCookie;
  let secondCoachCookie;
  let scoutCookie;

  const create = (body, cookie = coachCookie) =>
    createPlayerRoute(makeRequest("/api/players", { method: "POST", body, cookie }));
  const list = (qs = "", cookie = coachCookie) => listPlayersRoute(makeRequest(`/api/players${qs}`, { cookie }));
  const get = (id, cookie = coachCookie) => getPlayerRoute(makeRequest(`/api/players/${id}`, { cookie }), ctx(id));
  const patch = (id, body, cookie = coachCookie) =>
    patchPlayerRoute(makeRequest(`/api/players/${id}`, { method: "PATCH", body, cookie }), ctx(id));
  const reset = (id, body, cookie = coachCookie) =>
    resetPasswordRoute(makeRequest(`/api/players/${id}/reset-password`, { method: "POST", body, cookie }), ctx(id));

  const newPlayer = (overrides = {}) => ({
    name: "Player One",
    age: 16,
    sport: "Cricket",
    email: `p${Math.random().toString(36).slice(2, 10)}@academy.test`,
    temporaryPassword: "Welcome@123",
    ...overrides,
  });

  beforeAll(async () => {
    mongo = await startTestDatabase("sports-academy-players-test");
    await createUser({ name: "Coach A", email: "coach.a@academy.test", password: PASSWORD, role: ROLES.COACH });
    await createUser({ name: "Coach B", email: "coach.b@academy.test", password: PASSWORD, role: ROLES.COACH });
    await createUser({ name: "Scout", email: "scout@academy.test", password: PASSWORD, role: ROLES.SCOUT });
    coachCookie = (await loginAs("coach.a@academy.test", PASSWORD)).cookie;
    secondCoachCookie = (await loginAs("coach.b@academy.test", PASSWORD)).cookie;
    scoutCookie = (await loginAs("scout@academy.test", PASSWORD)).cookie;
  });

  afterAll(() => stopTestDatabase(mongo));

  describe("POST /api/players", () => {
    it("compulsory test 1: creates three players, each with a login", async () => {
      const names = ["Arjun Mehta", "Bela Singh", "Chen Li"];
      for (const name of names) {
        const res = await create(newPlayer({ name, email: `${name.split(" ")[0].toLowerCase()}@academy.test` }));
        expect(res.status).toBe(201);
      }
      const stored = await Player.find({ name: { $in: names } });
      expect(stored).toHaveLength(3);
      const logins = await User.find({ player: { $in: stored.map((p) => p._id) }, role: ROLES.PLAYER });
      expect(logins).toHaveLength(3);
    });

    it("returns the contract shape, normalises sport and never returns the password", async () => {
      const res = await create(newPlayer({ name: "Asha Rao", sport: " table  TENNIS ", email: "Asha@Academy.test" }));
      const text = await res.clone().text();
      const body = await res.json();
      expect(body).toMatchObject({
        success: true,
        message: "Player created",
        data: {
          player: {
            name: "Asha Rao",
            age: 16,
            sport: "Table Tennis",
            isActive: true,
            account: { email: "asha@academy.test", mustChangePassword: true },
          },
        },
      });
      expect(text).not.toMatch(/Welcome@123|passwordHash|scrypt/);

      const user = await User.findOne({ email: "asha@academy.test" });
      const player = await Player.findById(body.data.player.id);
      expect(String(user.player)).toBe(body.data.player.id);
      expect(user.role).toBe(ROLES.PLAYER);
      expect(player.createdBy).toBeTruthy();
    });

    it("rejects a duplicate email with 409 and leaves no orphan player", async () => {
      const before = await Player.countDocuments();
      const res = await create(newPlayer({ name: "Dup Person", email: "coach.a@academy.test" }));
      expect(res.status).toBe(409);
      expect((await res.json()).errors[0]).toMatchObject({ field: "email", code: "DUPLICATE" });
      expect(await Player.countDocuments()).toBe(before);
    });

    it("returns 400 with field errors for invalid data", async () => {
      const res = await create({ name: "X", age: 3, sport: "", email: "bad", temporaryPassword: "short" });
      expect(res.status).toBe(400);
      const fields = (await res.json()).errors.map((e) => e.field).sort();
      expect(fields).toEqual(["age", "email", "name", "sport", "temporaryPassword"]);
    });

    it("is coach-only: 401 anonymous, 403 scout", async () => {
      expect((await create(newPlayer(), null)).status).toBe(401);
      const res = await create(newPlayer(), scoutCookie);
      expect(res.status).toBe(403);
      expect((await res.json()).errors[0].code).toBe("FORBIDDEN");
    });

    it("lets the new player log in, but only to change the password", async () => {
      await create(newPlayer({ name: "New Login", email: "newlogin@academy.test" }));
      const { response, body, cookie } = await loginAs("newlogin@academy.test", "Welcome@123");
      expect(response.status).toBe(200);
      expect(body.data.user).toMatchObject({ role: "PLAYER", mustChangePassword: true });

      // /me is allowed so the UI can redirect; protected APIs are not.
      expect((await meRoute(makeRequest("/api/auth/me", { cookie }))).status).toBe(200);
      const blocked = await list("", cookie);
      expect(blocked.status).toBe(403);
      expect((await blocked.json()).errors[0].code).toBe("PASSWORD_CHANGE_REQUIRED");
    });
  });

  describe("GET /api/players", () => {
    beforeAll(async () => {
      await create(newPlayer({ name: "Zara Football", sport: "football", email: "zara@academy.test" }));
      const res = await create(newPlayer({ name: "Yusuf Retired", sport: "Football", email: "yusuf@academy.test" }));
      const { player } = (await res.json()).data;
      await patch(player.id, { isActive: false });
    });

    it("lists all players sorted by name, with count", async () => {
      const body = await (await list()).json();
      const names = body.data.players.map((p) => p.name);
      expect(body.data.count).toBe(names.length);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
      expect(names).toContain("Zara Football");
    });

    it("shares one academy: another coach sees the same players", async () => {
      const mine = await (await list()).json();
      const theirs = await (await list("", secondCoachCookie)).json();
      expect(theirs.data.count).toBe(mine.data.count);
    });

    it("filters by sport (normalised), status and search", async () => {
      const football = (await (await list("?sport=FOOTBALL")).json()).data.players;
      expect(football.map((p) => p.name).sort()).toEqual(["Yusuf Retired", "Zara Football"]);

      const active = (await (await list("?sport=football&status=active")).json()).data.players;
      expect(active.map((p) => p.name)).toEqual(["Zara Football"]);

      const inactive = (await (await list("?status=inactive")).json()).data.players;
      expect(inactive.every((p) => p.isActive === false)).toBe(true);

      const byName = (await (await list("?search=zara")).json()).data.players;
      expect(byName.map((p) => p.name)).toEqual(["Zara Football"]);

      const byEmail = (await (await list("?search=yusuf%40")).json()).data.players;
      expect(byEmail.map((p) => p.name)).toEqual(["Yusuf Retired"]);
    });

    it("treats regex characters in search literally", async () => {
      expect((await list("?search=.*")).status).toBe(200);
      expect((await (await list("?search=.*")).json()).data.count).toBe(0);
    });

    it("rejects an invalid status filter", async () => {
      expect((await list("?status=retired")).status).toBe(400);
    });

    it("is coach-only", async () => {
      expect((await list("", null)).status).toBe(401);
      expect((await list("", scoutCookie)).status).toBe(403);
    });
  });

  describe("GET /api/players/:id", () => {
    it("returns one player", async () => {
      const { player } = (await (await create(newPlayer({ name: "Detail Me" }))).json()).data;
      const res = await get(player.id);
      expect(res.status).toBe(200);
      expect((await res.json()).data.player).toMatchObject({ id: player.id, name: "Detail Me" });
    });

    it("returns 400 for a malformed id and 404 for an unknown one", async () => {
      const bad = await get("not-an-id");
      expect(bad.status).toBe(400);
      expect((await bad.json()).errors[0].code).toBe("INVALID_ID");
      const missing = await get("665000000000000000000999");
      expect(missing.status).toBe(404);
      expect((await missing.json()).errors[0].code).toBe("NOT_FOUND");
    });

    it("is coach-only", async () => {
      const { player } = (await (await create(newPlayer())).json()).data;
      expect((await get(player.id, scoutCookie)).status).toBe(403);
    });
  });

  describe("PATCH /api/players/:id", () => {
    it("updates profile fields and syncs name and email to the login", async () => {
      const { player } = (await (await create(newPlayer({ name: "Old Name", email: "old@academy.test" }))).json()).data;
      const res = await patch(player.id, { name: "New Name", age: 18, sport: "hockey", email: "NEW@academy.test" });
      expect(res.status).toBe(200);
      const updated = (await res.json()).data.player;
      expect(updated).toMatchObject({ name: "New Name", age: 18, sport: "Hockey", account: { email: "new@academy.test" } });

      const user = await User.findById(updated.account.userId);
      expect(user.name).toBe("New Name");
      expect(user.email).toBe("new@academy.test");
    });

    it("rejects an email that another account uses", async () => {
      const { player } = (await (await create(newPlayer())).json()).data;
      const res = await patch(player.id, { email: "scout@academy.test" });
      expect(res.status).toBe(409);
    });

    it("deactivating a player disables their login immediately", async () => {
      const email = "deactivate@academy.test";
      const { player } = (await (await create(newPlayer({ email }))).json()).data;
      const { cookie } = await loginAs(email, "Welcome@123");
      expect((await meRoute(makeRequest("/api/auth/me", { cookie }))).status).toBe(200);

      expect((await patch(player.id, { isActive: false })).status).toBe(200);
      expect((await meRoute(makeRequest("/api/auth/me", { cookie }))).status).toBe(401);
      expect((await loginAs(email, "Welcome@123")).response.status).toBe(403);

      await patch(player.id, { isActive: true });
      expect((await loginAs(email, "Welcome@123")).response.status).toBe(200);
    });

    it("returns 400 for an empty or invalid body and 404 for unknown players", async () => {
      const { player } = (await (await create(newPlayer())).json()).data;
      expect((await patch(player.id, {})).status).toBe(400);
      expect((await patch(player.id, { age: "old" })).status).toBe(400);
      expect((await patch("665000000000000000000999", { age: 20 })).status).toBe(404);
    });

    it("is coach-only", async () => {
      const { player } = (await (await create(newPlayer())).json()).data;
      expect((await patch(player.id, { age: 20 }, scoutCookie)).status).toBe(403);
      expect((await patch(player.id, { age: 20 }, null)).status).toBe(401);
    });
  });

  describe("POST /api/players/:id/reset-password", () => {
    it("signs the player out everywhere and forces a password change", async () => {
      const email = "forgetful@academy.test";
      const { player } = (await (await create(newPlayer({ email }))).json()).data;
      // Simulate a player who already chose their own password.
      await User.updateOne({ email }, { mustChangePassword: false });
      const { cookie: oldCookie } = await loginAs(email, "Welcome@123");

      const res = await reset(player.id, { temporaryPassword: "Reset@5678" });
      expect(res.status).toBe(200);
      expect((await res.json()).data.player.account.mustChangePassword).toBe(true);

      expect((await meRoute(makeRequest("/api/auth/me", { cookie: oldCookie }))).status).toBe(401);
      expect((await loginAs(email, "Welcome@123")).response.status).toBe(401);
      const fresh = await loginAs(email, "Reset@5678");
      expect(fresh.response.status).toBe(200);
      expect(fresh.body.data.user.mustChangePassword).toBe(true);
    });

    it("validates the new password and the player id", async () => {
      const { player } = (await (await create(newPlayer())).json()).data;
      expect((await reset(player.id, { temporaryPassword: "short" })).status).toBe(400);
      expect((await reset("665000000000000000000999", { temporaryPassword: "Reset@5678" })).status).toBe(404);
    });

    it("returns 409 NO_LOGIN_ACCOUNT for a profile without a login", async () => {
      const orphan = await Player.create({ name: "No Login", age: 20, sport: "Cricket" });
      const res = await reset(String(orphan._id), { temporaryPassword: "Reset@5678" });
      expect(res.status).toBe(409);
      expect((await res.json()).errors[0].code).toBe("NO_LOGIN_ACCOUNT");
    });

    it("is coach-only", async () => {
      const { player } = (await (await create(newPlayer())).json()).data;
      expect((await reset(player.id, { temporaryPassword: "Reset@5678" }, scoutCookie)).status).toBe(403);
    });
  });
});
