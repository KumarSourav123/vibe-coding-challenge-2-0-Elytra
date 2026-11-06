"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/frontend/components/ui/Avatar";
import Card from "@/frontend/components/ui/Card";
import EmptyState from "@/frontend/components/ui/EmptyState";
import ErrorState from "@/frontend/components/ui/ErrorState";
import Icon from "@/frontend/components/ui/Icon";
import Input from "@/frontend/components/ui/Input";
import Select from "@/frontend/components/ui/Select";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { listReadyPlayers } from "../api/readinessApi";
import { formatScore } from "../utils/readinessText";
import { buildSportFilterOptions } from "@/frontend/utils/sport";
import { TH_CLASS, TableFooter } from "@/frontend/components/ui/Table";

/** Ready players only - the server never sends anyone else to a scout. */
export default function ScoutPlayerList() {
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const { loading, result, reload } = useApiQuery(`scout:${sport}`, () => listReadyPlayers({ sport }));

  if (result && !result.ok) return <ErrorState result={result} onRetry={reload} title="Could not load players" />;

  const term = search.trim().toLowerCase();
  const all = result?.ok ? result.data.players : [];
  const rows = all.filter((row) => row.player.name.toLowerCase().includes(term));
  const sportOptions = buildSportFilterOptions(all.map((r) => r.player.sport), sport);

  return (
    <Card padding={false}>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-5">
        <Input
          aria-label="Search players"
          type="search"
          icon="search"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1"
        />
        <Select aria-label="Sport" options={sportOptions} value={sport} onChange={(e) => setSport(e.target.value)} className="sm:w-44" />
      </div>

      {!result ? (
        <div className="px-5">
          <LoadingBlock label="Loading ready players" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="target"
          title={all.length === 0 ? "No Ready players yet" : "No players match your search"}
          description={
            all.length === 0
              ? "Players appear here once they reach 75% attendance and have played at least 2 matches."
              : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th scope="col" className={TH_CLASS}>Player</th>
                  <th scope="col" className={TH_CLASS}>Attendance</th>
                  <th scope="col" className={TH_CLASS}>Matches</th>
                  <th scope="col" className={TH_CLASS}>Average</th>
                  <th scope="col" className={TH_CLASS}>Best</th>
                  <th scope="col" className="w-10 px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ player, readiness, performance }) => (
                  <tr key={player.id} className="group relative transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={player.name} size="sm" />
                        <div>
                          <Link
                            href={`/scout/players/${player.id}`}
                            className="font-medium text-slate-900 after:absolute after:inset-0 after:content-['']"
                          >
                            {player.name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {player.sport} · {player.age} yrs
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 tabular-nums">{readiness.attendancePercent}%</td>
                    <td className="px-5 py-3.5 text-slate-700 tabular-nums">{readiness.matchesPlayed}</td>
                    <td className="px-5 py-3.5 text-slate-700 tabular-nums">{formatScore(performance.averageScore)}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 tabular-nums">{formatScore(performance.bestScore)}</td>
                    <td className="px-5 py-3.5 text-slate-300 group-hover:text-slate-500">
                      <Icon name="chevronRight" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableFooter loading={loading}>
            {rows.length} Ready player{rows.length === 1 ? "" : "s"}
          </TableFooter>
        </>
      )}
    </Card>
  );
}
