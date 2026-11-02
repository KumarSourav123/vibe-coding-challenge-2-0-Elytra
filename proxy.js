import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/authToken";
import { CHANGE_PASSWORD_PATH, getHomePathForRole, getRoleForPath } from "@/lib/roles";

const GUEST_ONLY_PATHS = new Set(["/login", "/register"]);

/**
 * Page-level route protection (Next.js 16 Proxy).
 *
 * - /login and /register: signed-in users go to their home.
 * - /account/*: any signed-in user.
 * - /coach, /player, /scout (and sub-paths): matching role only; others go to
 *   /login or their own home.
 * - A user with a temporary password is sent to /account/password first.
 *
 * This guides navigation only. Every API route enforces auth on its own with
 * requireAuth/requireRole, which also re-checks the user in the database.
 */
export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const session = await readSession(request);
  const signedInHome = session && (session.pwc ? CHANGE_PASSWORD_PATH : getHomePathForRole(session.role));

  if (GUEST_ONLY_PATHS.has(pathname)) {
    return session ? redirectTo(request, signedInHome) : NextResponse.next();
  }

  const isAccountPath = pathname === "/account" || pathname.startsWith("/account/");
  const requiredRole = getRoleForPath(pathname);
  if (!isAccountPath && !requiredRole) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (session.pwc && pathname !== CHANGE_PASSWORD_PATH) {
    return redirectTo(request, CHANGE_PASSWORD_PATH);
  }

  if (requiredRole && session.role !== requiredRole) {
    return redirectTo(request, getHomePathForRole(session.role));
  }

  return NextResponse.next();
}

async function readSession(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch (error) {
    // Missing AUTH_SECRET: treat as signed out; the login API reports the config error.
    console.error("[proxy]", error.message);
    return null;
  }
}

function redirectTo(request, pathname) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export const config = {
  matcher: ["/login", "/register", "/account/:path*", "/coach/:path*", "/player/:path*", "/scout/:path*"],
};
