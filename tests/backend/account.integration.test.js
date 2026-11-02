import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { POST as changePasswordRoute } from "@/app/api/auth/change-password/route";
import { GET as meRoute } from "@/app/api/auth/me/route";
import { POST as registerRoute } from "@/app/api/auth/register/route";
import { User } from "@/backend/models";
import { ROLES } from "@/backend/utils/constants";
import { createUser, loginAs, startTestDatabase, stopTestDatabase } from "../helpers/db";
import { makeRequest, sessionCookieFrom } from "../helpers/requests";

const register = (body) => registerRoute(makeRequest("/api/auth/register", { method: "POST", body }));
const changePassword = (body, cookie) =>
  changePasswordRoute(makeRequest("/api/auth/change-password", { method: "POST", body, cookie }));
const me = (cookie) => meRoute(makeRequest("/api/auth/me", { cookie }));

// Registration (§2.5) and password change (§2.6) against a real in-memory MongoDB.
describe("account API", () => {
  let mongo;

  beforeAll(async () => {
    mongo = await startTestDatabase("sports-academy-account-test");
  });

  afterAll(() => stopTestDatabase(mongo));
  afterEach(() => vi.unstubAllEnvs());

  describe("POST /api/auth/register", () => {
    const coach = {
      name: "Coach Kim",
      email: "kim@academy.test",
      password: "kim-password-1",
      role: "COACH",
      accessCode: "test-coach-code",
    };

    it("registers a coach with the right code, logs them in and lands on /coach", async () => {
      const res = await register(coach);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        success: true,
        message: "Account created",
        data: { homePath: "/coach", user: { role: "COACH", email: "kim@academy.test", mustChangePassword: false } },
      });
      const cookie = sessionCookieFrom(res);
      expect((await me(cookie)).status).toBe(200);
      const stored = await User.findOne({ email: "kim@academy.test" }).select("+passwordHash");
      expect(stored.passwordHash).toMatch(/^scrypt\$/);
    });

    it("registers a scout with the scout code", async () => {
      const res = await register({ ...coach, email: "scout.sam@academy.test", role: "SCOUT", accessCode: "test-scout-code" });
      expect(res.status).toBe(201);
      expect((await res.json()).data.homePath).toBe("/scout");
    });

    it("rejects a wrong access code (and the other role's code) without creating a user", async () => {
      for (const accessCode of ["wrong-code-123", "test-scout-code"]) {
        const res = await register({ ...coach, email: "intruder@academy.test", accessCode });
        expect(res.status).toBe(403);
        expect((await res.json()).errors[0]).toMatchObject({ field: "accessCode", code: "INVALID_ACCESS_CODE" });
      }
      expect(await User.exists({ email: "intruder@academy.test" })).toBeNull();
    });

    it("checks the access code before revealing that an email exists", async () => {
      const res = await register({ ...coach, accessCode: "wrong-code-123" }); // kim@ already exists
      expect(res.status).toBe(403);
    });

    it("returns 409 for an existing email with a valid code", async () => {
      const res = await register(coach);
      expect(res.status).toBe(409);
      expect((await res.json()).errors[0]).toMatchObject({ field: "email", code: "DUPLICATE" });
    });

    it("refuses PLAYER self-registration", async () => {
      const res = await register({ ...coach, email: "p@academy.test", role: "PLAYER" });
      expect(res.status).toBe(400);
      expect((await res.json()).errors[0].field).toBe("role");
    });

    it("is disabled when the role's code is not configured", async () => {
      vi.stubEnv("COACH_SIGNUP_CODE", "");
      const res = await register({ ...coach, email: "late@academy.test" });
      expect(res.status).toBe(403);
      expect((await res.json()).errors[0].code).toBe("REGISTRATION_DISABLED");
    });

    it("validates fields, including password length", async () => {
      const res = await register({ name: "", email: "bad", password: "short", role: "COACH", accessCode: "" });
      expect(res.status).toBe(400);
      const fields = (await res.json()).errors.map((e) => e.field).sort();
      expect(fields).toEqual(["accessCode", "email", "name", "password"]);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("full first-login flow: blocked until changed, then old sessions stop working", async () => {
      await createUser({
        name: "Temp Player",
        email: "temp.player@academy.test",
        password: "Welcome@123",
        role: ROLES.PLAYER,
        mustChangePassword: true,
      });
      const first = await loginAs("temp.player@academy.test", "Welcome@123");
      const second = await loginAs("temp.player@academy.test", "Welcome@123"); // e.g. another device
      expect(first.body.data.user.mustChangePassword).toBe(true);

      const res = await changePassword({ currentPassword: "Welcome@123", newPassword: "MyOwnPass99" }, first.cookie);
      expect(res.status).toBe(200);
      expect((await res.json()).data.user.mustChangePassword).toBe(false);

      const newCookie = sessionCookieFrom(res);
      expect(newCookie).toBeTruthy();
      expect((await me(newCookie)).status).toBe(200);
      expect((await me(first.cookie)).status).toBe(401);
      expect((await me(second.cookie)).status).toBe(401);

      expect((await loginAs("temp.player@academy.test", "Welcome@123")).response.status).toBe(401);
      const relogin = await loginAs("temp.player@academy.test", "MyOwnPass99");
      expect(relogin.response.status).toBe(200);
      expect(relogin.body.data.user.mustChangePassword).toBe(false);
    });

    it("rejects a wrong current password", async () => {
      await createUser({ name: "Coach Z", email: "z@academy.test", password: "z-password-1", role: ROLES.COACH });
      const { cookie } = await loginAs("z@academy.test", "z-password-1");
      const res = await changePassword({ currentPassword: "nope-nope-1", newPassword: "z-password-2" }, cookie);
      expect(res.status).toBe(400);
      expect((await res.json()).errors[0]).toMatchObject({ field: "currentPassword", code: "INVALID_CURRENT_PASSWORD" });
      expect((await me(cookie)).status).toBe(200); // a failed attempt does not sign you out
    });

    it("rejects reusing the same password and weak passwords", async () => {
      const { cookie } = await loginAs("z@academy.test", "z-password-1");
      const same = await changePassword({ currentPassword: "z-password-1", newPassword: "z-password-1" }, cookie);
      expect(same.status).toBe(400);
      const weak = await changePassword({ currentPassword: "z-password-1", newPassword: "short" }, cookie);
      expect(weak.status).toBe(400);
    });

    it("requires a session", async () => {
      expect((await changePassword({ currentPassword: "a", newPassword: "bbbbbbbb" }, null)).status).toBe(401);
    });
  });
});
