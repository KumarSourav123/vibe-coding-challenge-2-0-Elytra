"use client";

import Badge from "@/frontend/components/ui/Badge";
import Button from "@/frontend/components/ui/Button";
import Spinner from "@/frontend/components/ui/Spinner";
import { cn } from "@/frontend/utils/cn";
import { useHealthStatus } from "../hooks/useHealthStatus";

const STATE_UI = {
  loading: { tone: "neutral", label: "Checking", ring: "bg-slate-300", dot: "bg-slate-400" },
  connected: { tone: "success", label: "Operational", ring: "bg-emerald-400", dot: "bg-emerald-500" },
  disconnected: { tone: "danger", label: "Disconnected", ring: "bg-rose-400", dot: "bg-rose-500" },
};

const HINTS = {
  DB_NOT_CONFIGURED: "Set MONGODB_URI in .env.local and restart the dev server.",
  DB_CONNECTION_FAILED: "Check the connection string and Atlas network access settings.",
  NETWORK_ERROR: "The API server could not be reached.",
};

/** Live database connection status, backed by GET /api/health. */
export default function HealthStatus() {
  const { state, result, refresh } = useHealthStatus();
  const ui = STATE_UI[state];

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-slate-200/80 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="relative mt-1.5 flex h-2.5 w-2.5">
          {state === "connected" && (
            <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", ui.ring)} />
          )}
          <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", ui.dot)} />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Database</h3>
            <Badge tone={ui.tone}>{ui.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500" aria-live="polite">
            {state === "loading" && "Contacting /api/health..."}
            {state === "connected" &&
              `MongoDB is reachable${result?.latencyMs != null ? ` · ${result.latencyMs} ms` : ""}`}
            {state === "disconnected" && (
              <>
                {result?.message}. {HINTS[result?.errorCode]}
              </>
            )}
          </p>
          {result?.checkedAt && state !== "loading" && (
            <p className="mt-1 text-xs text-slate-400">Checked {new Date(result.checkedAt).toLocaleTimeString()}</p>
          )}
        </div>
      </div>
      <Button variant="secondary" size="sm" icon={state === "loading" ? undefined : "refresh"} onClick={refresh} disabled={state === "loading"}>
        {state === "loading" ? <Spinner label="Checking health" /> : "Recheck"}
      </Button>
    </div>
  );
}
