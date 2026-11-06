"use client";

import PageHeader from "@/frontend/components/layout/PageHeader";
import Avatar from "@/frontend/components/ui/Avatar";
import ErrorState from "@/frontend/components/ui/ErrorState";
import NotFoundCard from "@/frontend/components/ui/NotFoundCard";
import { isNotFoundResult } from "@/frontend/utils/apiClient";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { getReadyPlayer } from "../api/readinessApi";
import PerformanceDetail from "./PerformanceDetail";
import ReadinessBadge from "./ReadinessBadge";

const BACK = { backHref: "/scout", backLabel: "Ready players" };

/** One Ready player. Non-Ready players come back as "not found" from the server. */
export default function ScoutPlayerDetail({ playerId }) {
  const { result, reload } = useApiQuery(`scout-player:${playerId}`, () => getReadyPlayer(playerId));

  if (!result) {
    return (
      <>
        <PageHeader title="Player" {...BACK} />
        <LoadingBlock label="Loading player" />
      </>
    );
  }

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Player" {...BACK} />
        {isNotFoundResult(result) ? (
          <NotFoundCard
            title="Player not available"
            description="This player isn't on the Ready list."
            backHref="/scout"
            backLabel="Back to Ready players"
          />
        ) : (
          <ErrorState result={result} onRetry={reload} title="Could not load player" />
        )}
      </>
    );
  }

  const { profile, readiness } = result.data;
  return (
    <>
      <PageHeader
        {...BACK}
        title={
          <span className="flex items-center gap-4">
            <Avatar name={profile.name} size="lg" />
            <span className="min-w-0">
              <span className="block truncate">{profile.name}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-normal tracking-normal text-slate-500">
                {profile.sport} · {profile.age} years
                <ReadinessBadge isReady={readiness.isReady} />
              </span>
            </span>
          </span>
        }
      />
      <PerformanceDetail detail={result.data} />
    </>
  );
}
