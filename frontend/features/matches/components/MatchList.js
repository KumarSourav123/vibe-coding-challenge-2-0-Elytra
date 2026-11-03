"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import EmptyState from "@/frontend/components/ui/EmptyState";
import ErrorState from "@/frontend/components/ui/ErrorState";
import Icon from "@/frontend/components/ui/Icon";
import Select from "@/frontend/components/ui/Select";
import Spinner, { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { COMMON_SPORTS } from "@/frontend/features/players/data/sports";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { formatDayLabel } from "@/frontend/utils/date";
import { listMatches } from "../api/matchesApi";

const TH = "px-5 py-3 text-left text-xs font-medium text-slate-500";

/** Matches, newest first, with participant count and top scorer. */
export default function MatchList() {
  const [sport, setSport] = useState("");
  const { loading, result, reload } = useApiQuery(`matches:${sport}`, () => listMatches({ sport }));

  const matches = result?.ok ? result.data.matches : [];
  const sportOptions = [
    { value: "", label: "All sports" },
    ...[...new Set([...COMMON_SPORTS, ...matches.map((m) => m.sport), ...(sport ? [sport] : [])])]
      .sort()
      .map((name) => ({ value: name, label: name })),
  ];

  return (
    <Card padding={false}>
      <div className="flex justify-end border-b border-slate-100 p-4 sm:px-5">
        <Select aria-label="Sport" options={sportOptions} value={sport} onChange={(e) => setSport(e.target.value)} className="w-full sm:w-44" />
      </div>

      {result && !result.ok ? (
        <div className="p-5">
          <ErrorState result={result} onRetry={reload} title="Could not load matches" />
        </div>
      ) : !result ? (
        <div className="px-5">
          <LoadingBlock label="Loading matches" />
        </div>
      ) : matches.length === 0 ? (
        sport ? (
          <EmptyState
            icon="search"
            title={`No ${sport} matches`}
            action={
              <Button variant="secondary" size="sm" onClick={() => setSport("")}>
                Show all sports
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="trophy"
            title="No matches yet"
            description="Close the day's practice session, then record a match with the players who were present."
            action={
              <Button href="/coach/matches/new" icon="plus" size="sm">
                New match
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th scope="col" className={TH}>Match</th>
                  <th scope="col" className={TH}>Sport</th>
                  <th scope="col" className={TH}>Players</th>
                  <th scope="col" className={TH}>Top scorer</th>
                  <th scope="col" className="w-10 px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matches.map((match) => (
                  <tr key={match.id} className="group relative transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/coach/matches/${match.id}`}
                        className="font-medium text-slate-900 after:absolute after:inset-0 after:content-['']"
                      >
                        vs {match.opponent}
                      </Link>
                      <p className="text-xs text-slate-500">{formatDayLabel(match.date)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{match.sport}</td>
                    <td className="px-5 py-3.5 text-slate-700 tabular-nums">{match.summary.participants}</td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {match.summary.topScorer ? (
                        <>
                          {match.summary.topScorer.name}
                          <span className="ml-2 text-slate-500 tabular-nums">{match.summary.topScore}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 group-hover:text-slate-500">
                      <Icon name="chevronRight" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              {result.data.count} match{result.data.count === 1 ? "" : "es"}
            </span>
            {loading && <Spinner label="Updating" className="h-3.5 w-3.5" />}
          </div>
        </>
      )}
    </Card>
  );
}
