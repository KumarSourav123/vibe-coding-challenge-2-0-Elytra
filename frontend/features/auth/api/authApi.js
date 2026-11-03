/**
 * Client for the auth endpoints (docs/API_CONTRACTS.md §2.2–2.4).
 * The session lives in an HttpOnly cookie, so the browser never sees the token;
 * these functions only send credentials and read the session user.
 */

import { apiRequest } from "@/frontend/utils/apiClient";

export const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  me: "/api/auth/me",
  register: "/api/auth/register",
  registerAcademy: "/api/auth/register-academy",
  lookupJoinCode: "/api/academies/lookup",
  changePassword: "/api/auth/change-password",
};

/** Map an apiRequest result carrying `{ user, homePath }` to the login result shape. */
function toSessionResult(result) {
  return result.ok ? { ok: true, user: result.data.user, homePath: result.data.homePath } : result;
}

/**
 * Join an academy as Coach or Scout (§2.5). The join code decides the role.
 * @param {{ joinCode: string, name: string, email: string, password: string }} input
 */
export async function register(input) {
  return toSessionResult(await apiRequest(AUTH_ENDPOINTS.register, { method: "POST", body: input }));
}

/**
 * Create a new academy and become its Head Coach (§2.5a).
 * @param {{ academyName: string, name: string, email: string, password: string }} input
 */
export async function registerAcademy(input) {
  return toSessionResult(await apiRequest(AUTH_ENDPOINTS.registerAcademy, { method: "POST", body: input }));
}

/** Preview a join code (§2.5b) -> { ok, data: { academy: { name }, role } }. */
export function lookupJoinCode(code) {
  return apiRequest(AUTH_ENDPOINTS.lookupJoinCode, { query: { code } });
}

/** Change your own password (§2.6). Other sessions are signed out by the server. */
export async function changePassword({ currentPassword, newPassword }) {
  return toSessionResult(
    await apiRequest(AUTH_ENDPOINTS.changePassword, { method: "POST", body: { currentPassword, newPassword } })
  );
}

const NETWORK_ERROR = { code: "NETWORK_ERROR", message: "Unable to reach the server. Please try again." };

async function readBody(response) {
  return response.json().catch(() => null);
}

/**
 * Normalise a login response body.
 * @returns {{ ok: true, user: object, homePath: string } |
 *           { ok: false, code: string, message: string, fieldErrors: Record<string, string> }}
 */
export function parseLoginResponse(body) {
  if (body?.success === true && body.data?.user) {
    return { ok: true, user: body.data.user, homePath: body.data.homePath };
  }

  const errors = Array.isArray(body?.errors) ? body.errors : [];
  const fieldErrors = {};
  for (const error of errors) {
    if (error.field && !fieldErrors[error.field]) fieldErrors[error.field] = error.message;
  }

  return {
    ok: false,
    code: errors[0]?.code ?? "UNKNOWN",
    message: body?.message ?? "Login failed. Please try again.",
    fieldErrors,
  };
}

/** @param {{ email: string, password: string }} credentials */
export async function login(credentials) {
  try {
    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return parseLoginResponse(await readBody(response));
  } catch {
    return { ok: false, ...NETWORK_ERROR, fieldErrors: {} };
  }
}

/** Clears the session cookie. Resolves to true when the server confirmed it. */
export async function logout() {
  try {
    const response = await fetch(AUTH_ENDPOINTS.logout, { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<
 *   { status: "authenticated", user: object, homePath: string } |
 *   { status: "unauthenticated" } |
 *   { status: "error", message: string }
 * >}
 */
export async function fetchCurrentUser() {
  try {
    const response = await fetch(AUTH_ENDPOINTS.me, { cache: "no-store" });
    const body = await readBody(response);
    if (body?.success === true && body.data?.user) {
      return { status: "authenticated", user: body.data.user, homePath: body.data.homePath };
    }
    if (response.status === 401) return { status: "unauthenticated" };
    return { status: "error", message: body?.message ?? "Could not load your session" };
  } catch {
    return { status: "error", message: NETWORK_ERROR.message };
  }
}
