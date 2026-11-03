"use client";

import Alert from "@/frontend/components/ui/Alert";
import Avatar from "@/frontend/components/ui/Avatar";
import Badge from "@/frontend/components/ui/Badge";
import Button from "@/frontend/components/ui/Button";
import ErrorState from "@/frontend/components/ui/ErrorState";
import { FIELD_BASE, FIELD_STATE } from "@/frontend/components/ui/Input";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { cn } from "@/frontend/utils/cn";
import { formatDayLabel } from "@/frontend/utils/date";
import { normalizeSport } from "@/frontend/utils/sport";
import { getEligiblePlayers } from "../api/matchesApi";

/**
 * Select players and enter scores. Only players PRESENT in a CLOSED session on
 * the same date and sport are offered (the server enforces the same rule).
 *
 * @param {object} props
 * @param {string} props.date "YYYY-MM-DD"
 * @param {string} props.sport
 * @param {Record<string, string>} props.selection { [playerId]: scoreText }
 * @param {(next: Record<string, string>) => void} props.onChange
 * @param {Record<string, string>} [props.errors] per-player messages
 * @param {Array<{ id: string, name: string, age?: number }>} [props.existing]
 *   players already in the match (edit mode), shown even if no longer eligible
 */
export default function ParticipantPicker({ date, sport, selection, onChange, errors = {}, existing = [], disabled }) {
  const normalized = normalizeSport(sport);
  const ready = Boolean(date && normalized);
  const { loading, result, reload } = useApiQuery(ready ? `eligible:${date}:${normalized}` : "eligible:none", () =>
    ready ? getEligiblePlayers({ date, sport: normalized }) : Promise.resolve(null)
  );

  if (!ready) {
    return <p className="text-sm text-slate-500">Choose a date and sport to see which players can be selected.</p>;
  }
  if (loading || !result) return <LoadingBlock label="Finding eligible players" />;
  if (!result.ok) return <ErrorState result={result} onRetry={reload} title="Could not load eligible players" />;

  const { players, sessions } = result.data;
  const eligibleIds = new Set(players.map((p) => p.id));
  const rows = [
    ...players.map((p) => ({ ...p, eligible: true })),
    ...existing.filter((p) => !eligibleIds.has(p.id)).map((p) => ({ ...p, eligible: false })),
  ];
  const day = formatDayLabel(date);

  if (rows.length === 0) {
    if (sessions.open > 0 && sessions.closed === 0) {
      return (
        <Alert tone="warning" title="Close the session first">
          <p>
            There is an open {normalized} session on {day}. Players can be selected once its attendance is closed.
          </p>
          <Button href="/coach/sessions" variant="secondary" size="sm" className="mt-3">
            Go to sessions
          </Button>
        </Alert>
      );
    }
    if (sessions.closed === 0) {
      return (
        <Alert tone="info" title={`No ${normalized} session on ${day}`}>
          <p>Only players marked present in a closed session on the match date can play.</p>
          <Button href="/coach/sessions/new" variant="secondary" size="sm" className="mt-3">
            New session
          </Button>
        </Alert>
      );
    }
    return (
      <Alert tone="info" title="No eligible players">
        Nobody was marked present in the closed {normalized} session on {day}.
      </Alert>
    );
  }

  const selectedCount = Object.keys(selection).length;
  const allSelected = players.length > 0 && players.every((p) => p.id in selection);

  function toggle(id) {
    const next = { ...selection };
    if (id in next) delete next[id];
    else next[id] = "";
    onChange(next);
  }

  function toggleAll() {
    if (allSelected) {
      const next = { ...selection };
      for (const p of players) delete next[p.id];
      onChange(next);
    } else {
      onChange({ ...Object.fromEntries(players.map((p) => [p.id, ""])), ...selection });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          {players.length} eligible · {selectedCount} selected
          {sessions.open > 0 && " · an open session on this day is not counted until closed"}
        </p>
        {players.length > 0 && (
          <Button variant="ghost" size="sm" onClick={toggleAll} disabled={disabled}>
            {allSelected ? "Clear all" : "Select all"}
          </Button>
        )}
      </div>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
        {rows.map((player) => {
          const selected = player.id in selection;
          const error = errors[player.id];
          return (
            <li key={player.id} className={cn("px-4 py-3", selected && "bg-slate-50/70")}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select ${player.name}`}
                  className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                  checked={selected}
                  onChange={() => toggle(player.id)}
                  disabled={disabled || (!player.eligible && !selected)}
                />
                <Avatar name={player.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{player.name}</p>
                  {!player.eligible ? (
                    <Badge tone="warning" className="mt-0.5">
                      No longer eligible
                    </Badge>
                  ) : (
                    player.age != null && <p className="text-xs text-slate-500">{player.age} yrs · present</p>
                  )}
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  placeholder="Score"
                  aria-label={`Score for ${player.name}`}
                  value={selected ? selection[player.id] : ""}
                  onChange={(e) => onChange({ ...selection, [player.id]: e.target.value })}
                  disabled={disabled || !selected}
                  className={cn(FIELD_BASE, error ? FIELD_STATE.error : FIELD_STATE.normal, "w-28 text-right tabular-nums")}
                />
              </div>
              {error && <p className="mt-1.5 pl-[4.25rem] text-xs text-rose-600">{error}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
