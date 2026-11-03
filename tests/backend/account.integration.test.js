import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as changePasswordRoute } from "@/app/api/auth/change-password/route";
import { GET as meRoute } from "@/app/api/auth/me/route";
import { createAcademy } from "@/backend/services/academyService";
import { ROLES } from "@/backend/utils/constants";
import { createUser, loginAs, startTestDatabase, stopTestDatabase } from "../helpers/db";
import { makeRequest, sessionCookieFrom } from "../helpers/requests";

const changePassword = (body, cookie) =>
  changePasswordRoute(makeRequest("/api/auth/change-password", { method: "POST", body, cookie }));
const me = (cookie) => meRoute(makeRequest("/api/auth/me", { cookie }));

// Password change (§2.6) against a real in-memory MongoDB. Registration is
// covered in academy.integration.test.js.
describe("POST /api/auth/change-password", () => {
  let mongo;
  let academy;

  beforeAll(async () => {
    mongo = await startTestDatabase("sports-academy-account-test");
    academy = await createAcademy("Test Academy");
    await createUser({ academy: academy._id, name: "Coach Z", email: "z@academy.test", password: "z-password-1", role: ROLES.COACH });
  });

  afterAll(() => stopTestDatabase(mongo));

  it("full first-login flow: blocked until changed, then old sessions stop working", async () => {
    await createUser({
      academy: academy._id,
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
    const body = await res.json();
    expect(body.data.user).toMatchObject({ mustChangePassword: false, academy: { name: "Test Academy" } });

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
