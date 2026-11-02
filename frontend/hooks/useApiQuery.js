"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Run an apiRequest-style fetcher whenever `requestKey` changes.
 *
 *   const { loading, result, reload, setResult } =
 *     useApiQuery(`player:${id}`, () => getPlayer(id));
 *
 * `result` keeps the previous response while a new one loads (no flicker),
 * and responses for outdated keys are ignored.
 */
export function useApiQuery(requestKey, fetcher) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ key: null, result: null });
  const fetcherRef = useRef(fetcher);
  const currentKey = `${requestKey}#${version}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef.current().then((result) => {
      if (!cancelled) setState({ key: currentKey, result });
    });
    return () => {
      cancelled = true;
    };
  }, [currentKey]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setResult = useCallback(
    (result) => setState((current) => ({ ...current, result })),
    []
  );

  return { loading: state.key !== currentKey, result: state.result, reload, setResult };
}
