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

  /** Start a check, cancelling any check still in flight. State updates only after it resolves. */
  const run = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    fetchHealth({ signal: controller.signal }).then(
      (health) => {
        setResult(health);
        setState(health.status);
      },
      (error) => {
        if (error?.name !== "AbortError") throw error;
      }
    );
  }, []);

  useEffect(() => {
    run();
    return () => controllerRef.current?.abort();
  }, [run]);

  const refresh = useCallback(() => {
    setState("loading");
    run();
  }, [run]);

  return { state, result, refresh };
}
