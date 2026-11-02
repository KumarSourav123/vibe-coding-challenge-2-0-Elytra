import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_ENDPOINTS,
  changePassword,
  fetchCurrentUser,
  login,
  logout,
  parseLoginResponse,
  register,
} from "@/frontend/features/auth/api/authApi";
import {
  coachUserMock,
  loginInvalidCredentialsMock,
  loginSuccessMock,
  loginValidationMock,
  meSuccessMock,
  meUnauthenticatedMock,
} from "@/frontend/features/auth/mocks/authMock";

const jsonResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe("parseLoginResponse", () => {
  it("returns the user and home path on success", () => {
    expect(parseLoginResponse(loginSuccessMock)).toEqual({ ok: true, user: coachUserMock, homePath: "/coach" });
  });

  it("returns a form-level error for invalid credentials", () => {
    expect(parseLoginResponse(loginInvalidCredentialsMock)).toEqual({
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
      fieldErrors: {},
    });
  });

  it("maps validation errors to fields", () => {
    expect(parseLoginResponse(loginValidationMock).fieldErrors).toEqual({
      email: "Email is invalid",
      password: "Password is required",
    });
  });

  it("handles an unparseable body", () => {
    expect(parseLoginResponse(null)).toMatchObject({ ok: false, code: "UNKNOWN" });
  });
});

describe("auth API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("POSTs credentials as JSON to the login endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(loginSuccessMock));
    vi.stubGlobal("fetch", fetchMock);
    const result = await login({ email: "coach@academy.test", password: "pw" });
    expect(fetchMock).toHaveBeenCalledWith(AUTH_ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "coach@academy.test", password: "pw" }),
    });
    expect(result.ok).toBe(true);
  });

  it("reports a network error from login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect(await login({ email: "a@b.co", password: "x" })).toMatchObject({ ok: false, code: "NETWORK_ERROR" });
  });

  it("fetchCurrentUser distinguishes authenticated, unauthenticated and error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(meSuccessMock)));
    expect(await fetchCurrentUser()).toEqual({ status: "authenticated", user: coachUserMock, homePath: "/coach" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(meUnauthenticatedMock, 401)));
    expect(await fetchCurrentUser()).toEqual({ status: "unauthenticated" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ success: false, message: "Service unavailable" }, 503)));
    expect(await fetchCurrentUser()).toEqual({ status: "error", message: "Service unavailable" });
  });

  it("register and changePassword return the session result shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(loginSuccessMock, 201)));
    expect(await register({ name: "C", email: "c@a.co", password: "x", role: "COACH", accessCode: "y" })).toEqual({
      ok: true,
      user: coachUserMock,
      homePath: "/coach",
    });

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          message: "Validation failed",
          errors: [{ field: "currentPassword", code: "INVALID_CURRENT_PASSWORD", message: "Current password is incorrect" }],
        },
        400
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await changePassword({ currentPassword: "a", newPassword: "bbbbbbbb" });
    expect(fetchMock.mock.calls[0][0]).toBe(AUTH_ENDPOINTS.changePassword);
    expect(result).toMatchObject({ ok: false, fieldErrors: { currentPassword: "Current password is incorrect" } });
  });

  it("logout POSTs to the logout endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }, 200));
    vi.stubGlobal("fetch", fetchMock);
    expect(await logout()).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(AUTH_ENDPOINTS.logout, { method: "POST" });
  });
});
