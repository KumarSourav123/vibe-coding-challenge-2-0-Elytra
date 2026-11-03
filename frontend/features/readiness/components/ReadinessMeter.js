import { cn } from "@/frontend/utils/cn";

/**
 * Progress bar with a threshold marker.
 * `compact` renders just the bar (for tables).
 */
export default function ReadinessMeter({ label, display, detail, value, max, target, met, compact = false }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const targetPercent = max > 0 ? Math.min((target / max) * 100, 100) : 0;

  const bar = (
    <div className={cn("relative rounded-full bg-slate-100", compact ? "h-1.5 w-24" : "h-2")}>
      <div
        className={cn("h-full rounded-full transition-all", met ? "bg-emerald-500" : "bg-amber-500")}
        style={{ width: `${percent}%` }}
      />
      <span
        aria-hidden="true"
        className={cn("absolute w-0.5 rounded bg-slate-900", compact ? "-top-0.5 h-2.5" : "-top-1 h-4")}
        style={{ left: `calc(${targetPercent}% - 1px)` }}
      />
    </div>
  );

  if (compact) return bar;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900 tabular-nums">{display}</span>
      </div>
      <div className="mt-2">{bar}</div>
      {detail && <p className="mt-1.5 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

/** Attendance + matches meters for a readiness object. */
export function ReadinessMeters({ readiness }) {
  const { minAttendancePercent, minMatchesPlayed } = readiness.requirements;
  return (
    <div className="space-y-5">
      <ReadinessMeter
        label="Attendance"
        display={`${readiness.attendancePercent}%`}
        detail={`${readiness.sessionsAttended} of ${readiness.completedSessions} completed sessions · needs ${minAttendancePercent}%`}
        value={readiness.attendancePercent}
        max={100}
        target={minAttendancePercent}
        met={
          readiness.completedSessions > 0 &&
          readiness.sessionsAttended * 100 >= minAttendancePercent * readiness.completedSessions
        }
      />
      <ReadinessMeter
        label="Matches played"
        display={readiness.matchesPlayed}
        detail={`needs ${minMatchesPlayed}`}
        value={readiness.matchesPlayed}
        max={Math.max(minMatchesPlayed * 2, readiness.matchesPlayed)}
        target={minMatchesPlayed}
        met={readiness.matchesPlayed >= minMatchesPlayed}
      />
    </div>
  );
}
