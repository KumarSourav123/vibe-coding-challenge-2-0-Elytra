"use client";

import ErrorState from "@/frontend/components/ui/ErrorState";
import StatCard from "@/frontend/components/ui/StatCard";
import { listPlayers } from "@/frontend/features/players/api/playersApi";
import { listSessions } from "@/frontend/features/sessions/api/sessionsApi";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";

/** Academy metrics for the coach overview, computed from real records. */
export default function CoachStats() {
  const players = useApiQuery("coach-stats-players", () => listPlayers());
  const sessions = useApiQuery("coach-stats-sessions", () => listSessions());

  const failed = [players, sessions].find((q) => q.result && !q.result.ok);
  if (failed) return <ErrorState result={failed.result} onRetry={failed.reload} title="Could not load overview" />;

  const playerList = players.result?.ok ? players.result.data.players : null;
  const sessionList = sessions.result?.ok ? sessions.result.data.sessions : null;
  const countPlayers = (fn) => (playerList ? playerList.filter(fn).length : null);
  const countSessions = (status) => (sessionList ? sessionList.filter((s) => s.status === status).length : null);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Active players"
        icon="users"
        value={countPlayers((p) => p.isActive)}
        hint={playerList ? `${playerList.length} in total` : undefined}
      />
      <StatCard
        label="Awaiting sign-in"
        icon="key"
        value={countPlayers((p) => p.account?.mustChangePassword)}
        hint="On a temporary password"
      />
      <StatCard label="Open sessions" icon="calendar" value={countSessions("OPEN")} hint="Attendance in progress" />
      <StatCard label="Closed sessions" icon="lock" value={countSessions("CLOSED")} hint="Count toward attendance %" />
    </div>
  );
}
