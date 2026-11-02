"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHealth } from "../api/healthApi";

/**
 * Tracks API/database health.
 * `state` is "loading" | "connected" | "disconnected".
 */
export function useHealthStatus() {
  const [state, setState] = useState("loading");
  const [result, setResult] = useState(null);
  const controllerRef = useRef(null);

  const check = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState("loading");
    try {
      const health = await fetchHealth({ signal: controller.signal });
      setResult(health);
      setState(health.status);
    } catch (error) {
      if (error?.name !== "AbortError") throw error;
    }
  }, []);

  useEffect(() => {
    // Initial check on mount; the state updates happen after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check();
    return () => controllerRef.current?.abort();
  }, [check]);

  return { state, result, refresh: check };
}
