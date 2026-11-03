"use client";

import ErrorState from "@/frontend/components/ui/ErrorState";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { getPlayerPerformance } from "../api/readinessApi";
import PerformanceDetail from "./PerformanceDetail";

/** Coach view of one player's performance and readiness (on the player page). */
export default function PlayerPerformanceSection({ playerId, refreshKey }) {
  const { result, reload } = useApiQuery(`performance:${playerId}:${refreshKey ?? ""}`, () =>
    getPlayerPerformance(playerId)
  );

  if (!result) return <LoadingBlock label="Loading performance" />;
  if (!result.ok) return <ErrorState result={result} onRetry={reload} title="Could not load performance" />;
  return <PerformanceDetail detail={result.data} />;
}
