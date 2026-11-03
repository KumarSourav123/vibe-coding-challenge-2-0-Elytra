"use client";

import ErrorState from "@/frontend/components/ui/ErrorState";
import StatCard from "@/frontend/components/ui/StatCard";
import { listMatches } from "@/frontend/features/matches/api/matchesApi";
import { listPlayers } from "@/frontend/features/players/api/playersApi";
import { getCoachDashboard } from "@/frontend/features/readiness/api/readinessApi";
import { listSessions } from "@/frontend/features/sessions/api/sessionsApi";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";

/** Academy metrics for the coach overview, computed from real records. */
export default function CoachStats() {
  const players = useApiQuery("coach-stats-players", () => listPlayers());
  const readiness = useApiQuery("coach-stats-readiness", () => getCoachDashboard());
  const sessions = useApiQuery("coach-stats-sessions", () => listSessions());
  const matches = useApiQuery("coach-stats-matches", () => listMatches());

  const failed = [players, readiness, sessions, matches].find((q) => q.result && !q.result.ok);
  if (failed) return <ErrorState result={failed.result} onRetry={failed.reload} title="Could not load overview" />;

  const playerList = players.result?.ok ? players.result.data.players : null;
  const sessionList = sessions.result?.ok ? sessions.result.data.sessions : null;
  const summary = readiness.result?.ok ? readiness.result.data.summary : null;
  const countSessions = (status) => sessionList.filter((s) => s.status === status).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Active players"
        icon="users"
        value={playerList ? playerList.filter((p) => p.isActive).length : null}
        hint={playerList ? `${playerList.length} in total` : undefined}
      />
      <StatCard
        label="Ready players"
        icon="target"
        value={summary ? summary.ready : null}
        hint={summary ? `${summary.notReady} not ready yet` : undefined}
      />
      <StatCard
        label="Closed sessions"
        icon="lock"
        value={sessionList ? countSessions("CLOSED") : null}
        hint={sessionList ? `${countSessions("OPEN")} still open` : undefined}
      />
      <StatCard
        label="Matches"
        icon="trophy"
        value={matches.result?.ok ? matches.result.data.count : null}
        hint="Recorded with scores"
      />
    </div>
  );
}
