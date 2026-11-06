"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copy text to the clipboard. `copied` is true for `resetMs` after a
 * successful copy (for "Copied" feedback), then resets on its own.
 *
 *   const { copied, copy } = useCopyToClipboard();
 *   <button onClick={() => copy(code)}>{copied ? "Copied" : "Copy"}</button>
 */
export function useCopyToClipboard(resetMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [resetMs]
  );

  return { copied, copy };
}
