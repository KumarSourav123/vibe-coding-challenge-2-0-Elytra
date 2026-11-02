import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthConfigError,
  getSessionCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "@/lib/authToken";

const claims = { sub: "665000000000000000000001", role: "COACH" };

function b64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("session tokens (HMAC-SHA256)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips claims with iat and a 7-day exp", async () => {
    const token = await signSessionToken(claims);
    expect(token.split(".")).toHaveLength(3);
    const payload = await verifySessionToken(token);
    expect(payload).toMatchObject(claims);
    expect(payload.exp - payload.iat).toBe(60 * 60 * 24 * 7);
  });

  it("rejects a token whose payload was changed (e.g. role escalation)", async () => {
    const [header, , signature] = (await signSessionToken({ ...claims, role: "PLAYER" })).split(".");
    const now = Math.floor(Date.now() / 1000);
    const forged = `${header}.${b64url({ ...claims, role: "COACH", iat: now, exp: now + 999 })}.${signature}`;
    expect(await verifySessionToken(forged)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    vi.stubEnv("AUTH_SECRET", "another-secret-that-is-long-enough-000000");
    const token = await signSessionToken(claims);
    vi.unstubAllEnvs();
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const longAgo = Math.floor(Date.now() / 1000) - 3600;
    const token = await signSessionToken(claims, { now: longAgo, expiresInSeconds: 60 });
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('rejects an unsigned "alg: none" token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ ...claims, iat: now, exp: now + 999 })}.`;
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rejects garbage values", async () => {
    for (const value of ["", "abc", "a.b.c", "a.b", null, undefined, 42]) {
      expect(await verifySessionToken(value)).toBeNull();
    }
  });

  it("throws AuthConfigError when AUTH_SECRET is missing or too short", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    await expect(signSessionToken(claims)).rejects.toThrow(AuthConfigError);
    vi.stubEnv("AUTH_SECRET", "short");
    await expect(verifySessionToken("a.b.c")).rejects.toThrow(AuthConfigError);
  });

  it("uses HttpOnly, SameSite=Lax cookies, Secure only in production", () => {
    expect(getSessionCookieOptions()).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", secure: false });
    vi.stubEnv("NODE_ENV", "production");
    expect(getSessionCookieOptions().secure).toBe(true);
    expect(getSessionCookieOptions(0).maxAge).toBe(0);
  });
});
