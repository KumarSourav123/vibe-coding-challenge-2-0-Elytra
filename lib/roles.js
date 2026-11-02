import { ROLES } from "@/backend/utils/constants";

/** Landing page for each role after login (docs/API_CONTRACTS.md §1.5). */
export const ROLE_HOME_PATHS = Object.freeze({
  [ROLES.COACH]: "/coach",
  [ROLES.PLAYER]: "/player",
  [ROLES.SCOUT]: "/scout",
});

/** Where users with a temporary password must go before anything else. */
export const CHANGE_PASSWORD_PATH = "/account/password";

export function getHomePathForRole(role) {
  return ROLE_HOME_PATHS[role] ?? "/";
}

/** Role that owns a protected page path, or null if the path is not role-restricted. */
export function getRoleForPath(pathname) {
  for (const [role, home] of Object.entries(ROLE_HOME_PATHS)) {
    if (pathname === home || pathname.startsWith(`${home}/`)) return role;
  }
  return null;
}
