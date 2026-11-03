import Badge from "@/frontend/components/ui/Badge";
import Card from "@/frontend/components/ui/Card";
import Icon from "@/frontend/components/ui/Icon";
import StatCard from "@/frontend/components/ui/StatCard";
import { cn } from "@/frontend/utils/cn";
import { formatDayLabel } from "@/frontend/utils/date";
import { formatScore, readinessGaps } from "../utils/readinessText";
import { ReadinessMeters } from "./ReadinessMeter";

/** Ready / Not ready verdict with the reasons and the two meters. */
export function ReadinessCard({ readiness, title = "Readiness" }) {
  const gaps = readinessGaps(readiness);
  return (
    <Card title={title}>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full",
            readiness.isReady ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-700"
          )}
        >
          <Icon name={readiness.isReady ? "check" : "clock"} className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-semibold text-slate-900">{readiness.isReady ? "Ready" : "Not ready yet"}</p>
          <p className="text-sm text-slate-500">
            {readiness.isReady
              ? "Meets the attendance and match requirements. Visible to scouts."
              : gaps.join(" · ")}
          </p>
        </div>
      </div>
      <div className="mt-6">
        <ReadinessMeters readiness={readiness} />
      </div>
    </Card>
  );
}

function HistoryList({ title, description, emptyText, rows }) {
  return (
    <Card title={title} description={description} padding={false}>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500 sm:px-6">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-4 px-5 py-3 text-sm sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{row.primary}</p>
                <p className="text-xs text-slate-500">{row.secondary}</p>
              </div>
              {row.trailing}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Full performance view shared by the player dashboard, the coach player page
 * and the scout detail page. `detail` is the "player performance detail" shape.
 */
export default function PerformanceDetail({ detail }) {
  const { readiness, performance, attendance, matches } = detail;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          icon="calendar"
          value={`${readiness.attendancePercent}%`}
          hint={`${readiness.sessionsAttended} of ${readiness.completedSessions} sessions`}
        />
        <StatCard label="Matches played" icon="trophy" value={readiness.matchesPlayed} hint={`Needs ${readiness.requirements.minMatchesPlayed}`} />
        <StatCard label="Best score" icon="sparkle" value={formatScore(performance.bestScore)} />
        <StatCard label="Average score" icon="activity" value={formatScore(performance.averageScore)} hint={`Total ${formatScore(performance.totalScore)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ReadinessCard readiness={readiness} />
        </div>
        <div className="space-y-6 lg:col-span-3">
          <HistoryList
            title="Match history"
            description="Newest first"
            emptyText="No matches played yet."
            rows={matches.map((m) => ({
              key: m.matchId,
              primary: `vs ${m.opponent}`,
              secondary: `${formatDayLabel(m.date)} · ${m.sport}`,
              trailing: <span className="text-base font-semibold text-slate-900 tabular-nums">{formatScore(m.score)}</span>,
            }))}
          />
          <HistoryList
            title="Attendance history"
            description="Completed (closed) sessions only"
            emptyText="No completed sessions yet."
            rows={attendance.map((a) => ({
              key: a.sessionId,
              primary: formatDayLabel(a.date),
              secondary: `${a.sport} practice`,
              trailing: (
                <Badge tone={a.status === "PRESENT" ? "success" : "danger"} dot>
                  {a.status === "PRESENT" ? "Present" : "Absent"}
                </Badge>
              ),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
