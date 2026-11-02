"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, login, logout } from "../api/authApi";

const AuthContext = createContext(null);

const SIGNED_OUT = { status: "unauthenticated", user: null, homePath: null };

function toSession(result) {
  return result.status === "authenticated"
    ? { status: "authenticated", user: result.user, homePath: result.homePath }
    : { ...SIGNED_OUT, status: result.status, message: result.message };
}

/**
 * App-wide session state. `status` is
 * "loading" | "authenticated" | "unauthenticated" | "error".
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState({ status: "loading", user: null, homePath: null });

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser().then((result) => {
      if (!cancelled) setSession(toSession(result));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setSession((current) => ({ ...current, status: "loading" }));
    setSession(toSession(await fetchCurrentUser()));
  }, []);

  const signIn = useCallback(async (credentials) => {
    const result = await login(credentials);
    if (result.ok) setSession({ status: "authenticated", user: result.user, homePath: result.homePath });
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setSession(SIGNED_OUT);
  }, []);

  /** Store a `{ user, homePath }` returned by register or change-password. */
  const applySession = useCallback(({ user, homePath }) => {
    setSession({ status: "authenticated", user, homePath });
  }, []);

  const value = useMemo(
    () => ({ ...session, refresh, signIn, signOut, applySession }),
    [session, refresh, signIn, signOut, applySession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
