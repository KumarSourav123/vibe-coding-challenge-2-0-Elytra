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

/** "2026-11-02" -> { weekday: "Mon", day: 2, month: "Nov" } (UTC, like formatDayLabel). */
function dateParts(dateOnly) {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  const part = (options) => date.toLocaleDateString("en-GB", { timeZone: "UTC", ...options });
  return { weekday: part({ weekday: "short" }), day: date.getUTCDate(), month: part({ month: "short" }) };
}

/** Ticket-style fixture card: date stub on the left, opponent and top scorer on the right. */
function FixtureCard({ match }) {
  const { weekday, day, month } = dateParts(match.date);
  const { participants, topScorer, topScore } = match.summary;

  return (
    <Link
      href={`/coach/matches/${match.id}`}
      className="group flex overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card"
      aria-label={`vs ${match.opponent}, ${formatDayLabel(match.date)}`}
    >
      <div className="relative flex w-20 shrink-0 flex-col items-center justify-center bg-brand-600 py-4 text-brand-fg before:absolute before:-top-2 before:-right-2 before:h-4 before:w-4 before:rounded-full before:bg-slate-50 after:absolute after:-right-2 after:-bottom-2 after:h-4 after:w-4 after:rounded-full after:bg-slate-50">
        <span className="text-[11px] font-semibold tracking-widest uppercase opacity-80">{weekday}</span>
        <span className="text-3xl leading-none font-bold tabular-nums">{day}</span>
        <span className="mt-0.5 text-xs font-semibold tracking-wide uppercase">{month}</span>
      </div>

      <div className="min-w-0 flex-1 border-l-2 border-dashed border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand-700 uppercase">
            {match.sport}
          </span>
          <Icon name="chevronRight" className="text-slate-300 transition-colors group-hover:text-brand-600" />
        </div>
        <p className="mt-2 truncate text-base font-semibold text-slate-900">
          <span className="mr-1.5 text-sm font-medium text-slate-400">vs</span>
          {match.opponent}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="users" className="h-3.5 w-3.5" />
            <span className="tabular-nums">{participants}</span> player{participants === 1 ? "" : "s"}
          </span>
          {topScorer ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Icon name="trophy" className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="truncate font-medium text-slate-700">{topScorer.name}</span>
              <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-semibold text-white tabular-nums">{topScore}</span>
            </span>
          ) : (
            <span>No scores yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}

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
          <ul data-tour="match-list" className="grid gap-4 bg-slate-50 p-4 sm:p-5 lg:grid-cols-2">
            {matches.map((match) => (
              <li key={match.id}>
                <FixtureCard match={match} />
              </li>
            ))}
          </ul>
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
