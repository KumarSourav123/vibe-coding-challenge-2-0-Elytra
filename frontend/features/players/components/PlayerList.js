"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/frontend/components/ui/Avatar";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import EmptyState from "@/frontend/components/ui/EmptyState";
import ErrorState from "@/frontend/components/ui/ErrorState";
import Icon from "@/frontend/components/ui/Icon";
import Input from "@/frontend/components/ui/Input";
import Select from "@/frontend/components/ui/Select";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { useDebouncedValue } from "@/frontend/hooks/useDebouncedValue";
import { listPlayers } from "../api/playersApi";
import PlayerStatusBadges from "./PlayerStatusBadges";
import { buildSportFilterOptions } from "@/frontend/utils/sport";
import { TH_CLASS, TableFooter } from "@/frontend/components/ui/Table";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/** Academy player list with search, sport and status filters. */
export default function PlayerList() {
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("all");
  const debouncedSearch = useDebouncedValue(search.trim());

  const filters = { search: debouncedSearch, sport, status };
  const { loading, result, reload } = useApiQuery(JSON.stringify(filters), () => listPlayers(filters));

  const players = result?.ok ? result.data.players : [];
  const hasFilters = Boolean(debouncedSearch || sport || status !== "all");

  // Offer common sports plus any sport already used by a listed player.
  const sportOptions = buildSportFilterOptions(players.map((p) => p.sport), sport);

  function clearFilters() {
    setSearch("");
    setSport("");
    setStatus("all");
  }

  return (
    <Card padding={false}>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-5">
        <Input
          aria-label="Search players"
          type="search"
          icon="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1"
        />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select aria-label="Sport" options={sportOptions} value={sport} onChange={(e) => setSport(e.target.value)} className="sm:w-40" />
          <Select aria-label="Status" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40" />
        </div>
      </div>

      {result && !result.ok ? (
        <div className="p-5">
          <ErrorState result={result} onRetry={reload} title="Could not load players" />
        </div>
      ) : !result ? (
        <div className="px-5">
          <LoadingBlock label="Loading players" />
        </div>
      ) : players.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="search"
            title="No players match your filters"
            description="Try a different search, sport or status."
            action={
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="users"
            title="No players yet"
            description="Add your first player to create their profile and login."
            action={
              <Button href="/coach/players/new" icon="plus" size="sm">
                Add player
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
                  <th scope="col" className={TH_CLASS}>Player</th>
                  <th scope="col" className={TH_CLASS}>Sport</th>
                  <th scope="col" className={TH_CLASS}>Age</th>
                  <th scope="col" className={TH_CLASS}>Status</th>
                  <th scope="col" className="w-10 px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {players.map((player) => (
                  <tr key={player.id} className="group relative transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={player.name} size="sm" />
                        <div className="min-w-0">
                          {/* The stretched link makes the whole row clickable. */}
                          <Link
                            href={`/coach/players/${player.id}`}
                            className="font-medium text-slate-900 after:absolute after:inset-0 after:content-['']"
                          >
                            {player.name}
                          </Link>
                          <p className="truncate text-xs text-slate-500">{player.account?.email ?? "No login"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{player.sport}</td>
                    <td className="px-5 py-3.5 text-slate-700 tabular-nums">{player.age}</td>
                    <td className="px-5 py-3.5">
                      <PlayerStatusBadges player={player} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 group-hover:text-slate-500">
                      <Icon name="chevronRight" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableFooter loading={loading}>
            {result.data.count} player{result.data.count === 1 ? "" : "s"}
            {hasFilters && " matching filters"}
          </TableFooter>
        </>
      )}
    </Card>
  );
}
