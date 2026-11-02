import { describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/authToken";
import { proxy } from "@/proxy";
import { makeRequest } from "../helpers/requests";

async function cookieFor(role, { pwc = false } = {}) {
  const token = await signSessionToken({ sub: "665000000000000000000001", role, sv: 0, pwc });
  return `sa_session=${token}`;
}

function isPassThrough(res) {
  return res.headers.get("x-middleware-next") === "1";
}

function redirectPath(res) {
  const location = res.headers.get("location");
  if (!location) return null;
  const url = new URL(location);
  return `${url.pathname}${url.search}`;
}

describe("proxy (page protection)", () => {
  it.each(["/coach", "/player", "/scout", "/coach/players"])(
    "redirects anonymous visitors from %s to /login?next=...",
    async (path) => {
      const res = await proxy(makeRequest(path));
      expect(res.status).toBe(307);
      expect(redirectPath(res)).toBe(`/login?next=${encodeURIComponent(path)}`);
    }
  );

  it("lets each role into its own area", async () => {
    for (const [role, path] of [
      ["COACH", "/coach"],
      ["PLAYER", "/player"],
      ["SCOUT", "/scout/players"],
    ]) {
      expect(isPassThrough(await proxy(makeRequest(path, { cookie: await cookieFor(role) })))).toBe(true);
    }
  });

  it("sends a user to their own home when they open another role's area", async () => {
    const res = await proxy(makeRequest("/coach", { cookie: await cookieFor("PLAYER") }));
    expect(redirectPath(res)).toBe("/player");
    const scout = await proxy(makeRequest("/player", { cookie: await cookieFor("SCOUT") }));
    expect(redirectPath(scout)).toBe("/scout");
  });

  it("redirects signed-in users away from /login", async () => {
    const res = await proxy(makeRequest("/login", { cookie: await cookieFor("COACH") }));
    expect(redirectPath(res)).toBe("/coach");
  });

  it("shows /login to anonymous users", async () => {
    expect(isPassThrough(await proxy(makeRequest("/login")))).toBe(true);
  });

  it("treats an invalid token as signed out", async () => {
    const res = await proxy(makeRequest("/coach", { cookie: "sa_session=forged.token.value" }));
    expect(redirectPath(res)).toBe("/login?next=%2Fcoach");
  });

  it("treats a missing AUTH_SECRET as signed out instead of crashing", async () => {
    const cookie = await cookieFor("COACH");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("AUTH_SECRET", "");
    const res = await proxy(makeRequest("/coach", { cookie }));
    vi.unstubAllEnvs();
    expect(redirectPath(res)).toBe("/login?next=%2Fcoach");
  });

  it("treats /register like /login: open to guests, signed-in users go home", async () => {
    expect(isPassThrough(await proxy(makeRequest("/register")))).toBe(true);
    expect(redirectPath(await proxy(makeRequest("/register", { cookie: await cookieFor("SCOUT") })))).toBe("/scout");
  });

  it("requires a session for /account pages, for any role", async () => {
    expect(redirectPath(await proxy(makeRequest("/account/password")))).toBe("/login?next=%2Faccount%2Fpassword");
    for (const role of ["COACH", "PLAYER", "SCOUT"]) {
      const res = await proxy(makeRequest("/account/password", { cookie: await cookieFor(role) }));
      expect(isPassThrough(res)).toBe(true);
    }
  });

  it("sends users with a temporary password to /account/password first", async () => {
    const cookie = await cookieFor("PLAYER", { pwc: true });
    for (const path of ["/player", "/coach", "/login", "/register", "/account"]) {
      expect(redirectPath(await proxy(makeRequest(path, { cookie })))).toBe("/account/password");
    }
    expect(isPassThrough(await proxy(makeRequest("/account/password", { cookie })))).toBe(true);
  });

  it("does not match lookalike paths such as /coaching", async () => {
    expect(isPassThrough(await proxy(makeRequest("/coaching")))).toBe(true);
  });
});
