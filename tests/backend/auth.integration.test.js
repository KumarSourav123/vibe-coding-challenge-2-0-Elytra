import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { requireAuth, requireRole } from "@/backend/middleware/auth";
import { Player, User } from "@/backend/models";
import { ROLES } from "@/backend/utils/constants";
import { hashPassword } from "@/backend/utils/password";
import { signSessionToken } from "@/lib/authToken";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb";
import { makeRequest, sessionCookieFrom } from "../helpers/requests";

const PASSWORD = "correct-horse-battery";

// End-to-end auth flow against a real in-memory MongoDB.
describe("authentication API", () => {
  let mongo;
  let player;

  const loginAs = (email, password = PASSWORD) =>
    login(makeRequest("/api/auth/login", { method: "POST", body: { email, password } }));

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri("sports-academy-auth-test");
    await connectToDatabase();
    await User.init();

    const passwordHash = await hashPassword(PASSWORD);
    player = await Player.create({ name: "Riya", age: 15, sport: "Football" });
    await User.create([
      { name: "Coach Kim", email: "coach@academy.test", passwordHash, role: ROLES.COACH },
      { name: "Scout Lee", email: "scout@academy.test", passwordHash, role: ROLES.SCOUT },
      { name: "Riya", email: "riya@academy.test", passwordHash, role: ROLES.PLAYER, player: player._id },
      { name: "Gone", email: "disabled@academy.test", passwordHash, role: ROLES.COACH, isActive: false },
    ]);
  });

  afterAll(async () => {
    await disconnectFromDatabase();
    await mongo?.stop();
    delete process.env.MONGODB_URI;
  });

  describe("POST /api/auth/login", () => {
    it.each([
      ["coach@academy.test", "COACH", "/coach"],
      ["scout@academy.test", "SCOUT", "/scout"],
      ["riya@academy.test", "PLAYER", "/player"],
    ])("logs in %s and returns its role home", async (email, role, homePath) => {
      const res = await loginAs(email);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toMatchObject({ success: true, message: "Login successful", data: { homePath } });
      expect(body.data.user).toMatchObject({ email, role });
      expect(sessionCookieFrom(res)).toBeTruthy();
    });

    it("sets an HttpOnly, SameSite=Lax cookie and never exposes the hash or token in the body", async () => {
      const res = await loginAs("coach@academy.test");
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toMatch(/sa_session=/);
      expect(setCookie).toMatch(/HttpOnly/i);
      expect(setCookie).toMatch(/SameSite=lax/i);
      expect(setCookie).toMatch(/Max-Age=604800/);
      const text = await res.text();
      expect(text).not.toMatch(/passwordHash|scrypt\$/);
      expect(text).not.toContain(res.cookies.get("sa_session").value);
    });

    it("links the player profile for PLAYER accounts", async () => {
      const body = await (await loginAs("riya@academy.test")).json();
      expect(body.data.user.playerId).toBe(String(player._id));
    });

    it("accepts the email in any case", async () => {
      expect((await loginAs("  COACH@Academy.Test ")).status).toBe(200);
    });

    it("returns the same 401 for a wrong password and an unknown email", async () => {
      const wrongPassword = await loginAs("coach@academy.test", "wrong-password");
      const unknownEmail = await loginAs("nobody@academy.test");
      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      const expected = {
        success: false,
        message: "Invalid email or password",
        errors: [{ code: "INVALID_CREDENTIALS", message: "Invalid email or password" }],
      };
      expect(await wrongPassword.json()).toEqual(expected);
      expect(await unknownEmail.json()).toEqual(expected);
      expect(sessionCookieFrom(wrongPassword)).toBeNull();
    });

    it("returns 403 ACCOUNT_DISABLED for a deactivated account with the correct password", async () => {
      const res = await loginAs("disabled@academy.test");
      expect(res.status).toBe(403);
      expect((await res.json()).errors[0].code).toBe("ACCOUNT_DISABLED");
      expect(sessionCookieFrom(res)).toBeNull();
    });

    it("returns 401, not 403, for a deactivated account with a wrong password", async () => {
      expect((await loginAs("disabled@academy.test", "nope-nope")).status).toBe(401);
    });

    it("returns 400 for invalid fields", async () => {
      const res = await login(makeRequest("/api/auth/login", { method: "POST", body: { email: "bad" } }));
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.errors.map((e) => e.field).sort()).toEqual(["email", "password"]);
    });

    it("rejects NoSQL-injection style payloads as validation errors", async () => {
      const res = await login(
        makeRequest("/api/auth/login", { method: "POST", body: { email: { $ne: null }, password: { $ne: null } } })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 INVALID_JSON for a non-JSON body", async () => {
      const res = await login(makeRequest("/api/auth/login", { method: "POST", rawBody: "email=a&password=b" }));
      expect(res.status).toBe(400);
      expect((await res.json()).errors[0].code).toBe("INVALID_JSON");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 UNAUTHENTICATED without a cookie", async () => {
      const res = await me(makeRequest("/api/auth/me"));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        success: false,
        message: "Authentication required",
        errors: [{ code: "UNAUTHENTICATED", message: "Please log in to continue" }],
      });
    });

    it("returns the session user for a valid cookie", async () => {
      const cookie = sessionCookieFrom(await loginAs("scout@academy.test"));
      const res = await me(makeRequest("/api/auth/me", { cookie }));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data).toMatchObject({ homePath: "/scout", user: { role: "SCOUT", name: "Scout Lee" } });
    });

    it("returns 401 and clears the cookie for a tampered token", async () => {
      const cookie = sessionCookieFrom(await loginAs("riya@academy.test"));
      const res = await me(makeRequest("/api/auth/me", { cookie: `${cookie.slice(0, -2)}xx` }));
      expect(res.status).toBe(401);
      expect(res.headers.get("set-cookie")).toMatch(/sa_session=;.*Max-Age=0/i);
    });

    it("returns 401 for a validly signed token of a user that does not exist", async () => {
      const token = await signSessionToken({ sub: "665000000000000000000099", role: "COACH" });
      expect((await me(makeRequest("/api/auth/me", { cookie: `sa_session=${token}` }))).status).toBe(401);
    });

    it("returns 401 once the user is deactivated, even with a previously valid cookie", async () => {
      const passwordHash = await hashPassword(PASSWORD);
      await User.create({ name: "Temp", email: "temp@academy.test", passwordHash, role: ROLES.SCOUT });
      const cookie = sessionCookieFrom(await loginAs("temp@academy.test"));
      expect((await me(makeRequest("/api/auth/me", { cookie }))).status).toBe(200);

      await User.updateOne({ email: "temp@academy.test" }, { isActive: false });
      expect((await me(makeRequest("/api/auth/me", { cookie }))).status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears the cookie", async () => {
      const res = await logout(makeRequest("/api/auth/logout", { method: "POST" }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, message: "Logged out", data: {} });
      expect(res.headers.get("set-cookie")).toMatch(/sa_session=;.*Max-Age=0/i);
    });
  });

  describe("requireAuth / requireRole guards", () => {
    it("throws 401 without a session", async () => {
      await expect(requireAuth(makeRequest("/api/x"))).rejects.toMatchObject({ statusCode: 401 });
    });

    it("throws 403 FORBIDDEN for the wrong role", async () => {
      const cookie = sessionCookieFrom(await loginAs("riya@academy.test"));
      await expect(requireRole(makeRequest("/api/x", { cookie }), ROLES.COACH)).rejects.toMatchObject({
        statusCode: 403,
        errors: [{ code: "FORBIDDEN" }],
      });
    });

    it("allows a matching role and returns the user from the database", async () => {
      const cookie = sessionCookieFrom(await loginAs("coach@academy.test"));
      const user = await requireRole(makeRequest("/api/x", { cookie }), ROLES.COACH, ROLES.SCOUT);
      expect(user.email).toBe("coach@academy.test");
    });

    it("uses the role stored in the database, not the role inside the token", async () => {
      // A validly signed token claiming COACH for a PLAYER account.
      const riya = await User.findOne({ email: "riya@academy.test" });
      const token = await signSessionToken({ sub: String(riya._id), role: ROLES.COACH });
      await expect(
        requireRole(makeRequest("/api/x", { cookie: `sa_session=${token}` }), ROLES.COACH)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
