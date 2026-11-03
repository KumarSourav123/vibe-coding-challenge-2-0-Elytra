"use client";

import PageHeader from "@/frontend/components/layout/PageHeader";
import Alert from "@/frontend/components/ui/Alert";
import ErrorState from "@/frontend/components/ui/ErrorState";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { getPlayerDashboard } from "../api/readinessApi";
import PerformanceDetail from "./PerformanceDetail";
import ReadinessBadge from "./ReadinessBadge";

/** The signed-in player's own records. The server picks the player from the session. */
export default function PlayerDashboard() {
  const { result, reload } = useApiQuery("player-dashboard", () => getPlayerDashboard());

  if (!result) {
    return (
      <>
        <PageHeader title="Your dashboard" />
        <LoadingBlock label="Loading your records" />
      </>
    );
  }

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Your dashboard" />
        {result.code === "NO_PLAYER_PROFILE" ? (
          <Alert tone="warning" title="No player profile linked">
            Your account isn&apos;t linked to a player profile yet. Ask your coach to check your account.
          </Alert>
        ) : (
          <ErrorState result={result} onRetry={reload} title="Could not load your dashboard" />
        )}
      </>
    );
  }

  const { profile, readiness } = result.data;
  const firstName = profile.name.split(/\s+/)[0];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`${profile.sport} · ${profile.age} years · Only you and your coaches can see these records.`}
        meta={<ReadinessBadge isReady={readiness.isReady} />}
      />
      <PerformanceDetail detail={result.data} />
    </>
  );
}
