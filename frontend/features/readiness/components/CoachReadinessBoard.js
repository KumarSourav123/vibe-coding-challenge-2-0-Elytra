"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/frontend/components/ui/Avatar";
import Badge from "@/frontend/components/ui/Badge";
import Card from "@/frontend/components/ui/Card";
import EmptyState from "@/frontend/components/ui/EmptyState";
import ErrorState from "@/frontend/components/ui/ErrorState";
import Input from "@/frontend/components/ui/Input";
import SegmentedControl from "@/frontend/components/ui/SegmentedControl";
import Select from "@/frontend/components/ui/Select";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import StatCard from "@/frontend/components/ui/StatCard";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { getCoachDashboard } from "../api/readinessApi";
import { meetsAttendance, readinessSummary } from "../utils/readinessText";
import ReadinessBadge from "./ReadinessBadge";
import ReadinessMeter from "./ReadinessMeter";
import { buildSportFilterOptions } from "@/frontend/utils/sport";
import { TH_CLASS, TableFooter } from "@/frontend/components/ui/Table";
import { MobileList, MobileListItem } from "@/frontend/components/ui/MobileList";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "ready", label: "Ready" },
  { value: "not_ready", label: "Not ready" },
];

/** Every player's attendance, matches and readiness, computed live by the server. */
export default function CoachReadinessBoard() {
  const [readiness, setReadiness] = useState("all");
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const filters = { readiness, sport };
  const { loading, result, reload } = useApiQuery(JSON.stringify(filters), () => getCoachDashboard(filters));

  if (result && !result.ok) return <ErrorState result={result} onRetry={reload} title="Could not load readiness" />;

  const summary = result?.ok ? result.data.summary : null;
  const term = search.trim().toLowerCase();
  const rows = result?.ok ? result.data.players.filter((row) => row.player.name.toLowerCase().includes(term)) : [];
  const sportOptions = buildSportFilterOptions(rows.map((r) => r.player.sport), sport);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatCard label="Players" icon="users" value={summary ? summary.players : null} />
        <StatCard label="Ready" icon="checkCircle" value={summary ? summary.ready : null} hint="Visible to scouts (if active)" />
        <StatCard label="Not ready" icon="clock" value={summary ? summary.notReady : null} />
      </div>

      <Card padding={false}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center sm:px-5">
          <SegmentedControl label="Filter by readiness" options={FILTERS} value={readiness} onChange={setReadiness} />
          <Input
            aria-label="Search players"
            type="search"
            icon="search"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:flex-1"
          />
          <Select aria-label="Sport" options={sportOptions} value={sport} onChange={(e) => setSport(e.target.value)} className="lg:w-44" />
        </div>

        {!result ? (
          <div className="px-5">
            <LoadingBlock label="Calculating readiness" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="target"
            title={summary.players === 0 ? "No players yet" : "No players match these filters"}
            description={summary.players === 0 ? "Add players, run sessions and record matches to see readiness." : undefined}
          />
        ) : (
          <>
            {/* Phones: one tappable card per player. Tablets and up: the full table. */}
            <MobileList>
              {rows.map(({ player, readiness: r }) => (
                <MobileListItem key={player.id} href={`/coach/players/${player.id}`} align="start" leading={<Avatar name={player.name} size="sm" />} chevron={false}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{player.name}</p>
                          <p className="text-xs text-slate-500">
                            {player.sport}
                            {!player.isActive && " · inactive"}
                          </p>
                        </div>
                        <ReadinessBadge isReady={r.isReady} />
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="w-10 shrink-0 font-medium text-slate-900 tabular-nums">{r.attendancePercent}%</span>
                        <ReadinessMeter
                          compact
                          value={r.attendancePercent}
                          max={100}
                          target={r.requirements.minAttendancePercent}
                          met={meetsAttendance(r)}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {r.sessionsAttended}/{r.completedSessions} sessions · {r.matchesPlayed}/{r.requirements.minMatchesPlayed} matches
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{readinessSummary(r)}</p>
                </MobileListItem>
              ))}
            </MobileList>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/60">
                  <tr>
                    <th scope="col" className={TH_CLASS}>Player</th>
                    <th scope="col" className={TH_CLASS}>Attendance</th>
                    <th scope="col" className={TH_CLASS}>Matches</th>
                    <th scope="col" className={TH_CLASS}>Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(({ player, readiness: r }) => (
                    <tr key={player.id} className="relative transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={player.name} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={`/coach/players/${player.id}`}
                              className="font-medium text-slate-900 after:absolute after:inset-0 after:content-['']"
                            >
                              {player.name}
                            </Link>
                            <p className="text-xs text-slate-500">
                              {player.sport}
                              {!player.isActive && " · inactive"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-12 font-medium text-slate-900 tabular-nums">{r.attendancePercent}%</span>
                          <ReadinessMeter
                            compact
                            value={r.attendancePercent}
                            max={100}
                            target={r.requirements.minAttendancePercent}
                            met={meetsAttendance(r)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {r.sessionsAttended}/{r.completedSessions} sessions
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 tabular-nums">
                        {r.matchesPlayed}
                        <span className="text-slate-400"> / {r.requirements.minMatchesPlayed}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ReadinessBadge isReady={r.isReady} />
                          {!player.isActive && <Badge>Inactive</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{readinessSummary(r)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TableFooter loading={loading}>
              {rows.length} player{rows.length === 1 ? "" : "s"} · Ready = attendance ≥ 75% and ≥ 2 matches
            </TableFooter>
          </>
        )}
      </Card>
    </div>
  );
}
