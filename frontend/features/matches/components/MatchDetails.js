"use client";

import { useState } from "react";
import PageHeader from "@/frontend/components/layout/PageHeader";
import Alert from "@/frontend/components/ui/Alert";
import Avatar from "@/frontend/components/ui/Avatar";
import Badge from "@/frontend/components/ui/Badge";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import ErrorState from "@/frontend/components/ui/ErrorState";
import NotFoundCard from "@/frontend/components/ui/NotFoundCard";
import { isNotFoundResult } from "@/frontend/utils/apiClient";
import FormSection, { FormActions } from "@/frontend/components/ui/FormSection";
import Input from "@/frontend/components/ui/Input";
import Icon from "@/frontend/components/ui/Icon";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { formatDayLabel } from "@/frontend/utils/date";
import { getMatch, updateMatch } from "../api/matchesApi";
import { buildParticipants, participantErrorsFrom, selectionFromMatch } from "../utils/participants";
import ParticipantPicker from "./ParticipantPicker";

const BACK = { backHref: "/coach/matches", backLabel: "Matches" };

const formatScore = (n) => (Number.isInteger(n) ? n : Number(n.toFixed(2)));

/** Big scoreboard banner with the match totals. */
function ScoreBanner({ match, average }) {
  const { summary } = match;
  const stats = [
    { label: "Players", value: summary.participants },
    { label: "Total score", value: formatScore(summary.totalScore) },
    { label: "Top score", value: summary.topScore != null ? formatScore(summary.topScore) : "—" },
    { label: "Average", value: average ?? "—" },
  ];

  return (
    <section aria-label="Match summary" className="overflow-hidden rounded-2xl bg-slate-900 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-white">
          <Icon name="trophy" className="h-3.5 w-3.5 text-brand-400" />
          {match.sport}
        </span>
        <span>Full time</span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border-l-2 border-white/15 pl-4">
            <dt className="text-xs font-medium text-slate-400">{stat.label}</dt>
            <dd className="mt-1 text-3xl font-bold tracking-tight text-white tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const PODIUM = [
  { place: 2, height: "h-16", block: "bg-slate-200 text-slate-700", medal: "bg-slate-400" },
  { place: 1, height: "h-24", block: "bg-brand-600 text-brand-fg", medal: "bg-amber-500" },
  { place: 3, height: "h-12", block: "bg-slate-100 text-slate-600", medal: "bg-amber-700" },
];

/** Top three scorers on a podium (2nd, 1st, 3rd). */
function Podium({ participants }) {
  if (participants.length === 0) return null;
  return (
    <Card title="Top performers" description="The match's three highest scores.">
      <div className="grid grid-cols-3 items-end gap-3 sm:gap-5">
        {PODIUM.map(({ place, height, block, medal }) => {
          const entry = participants[place - 1];
          if (!entry) return <div key={place} />;
          return (
            <div key={place} className="flex min-w-0 flex-col items-center text-center">
              <div className="relative">
                <Avatar name={entry.player.name} size={place === 1 ? "lg" : "md"} />
                <span
                  className={`absolute -right-1 -bottom-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${medal}`}
                >
                  {place}
                </span>
              </div>
              <p className="mt-2 w-full truncate text-sm font-semibold text-slate-900">{entry.player.name}</p>
              <p className="text-xs text-slate-500 tabular-nums">{formatScore(entry.score)} pts</p>
              <div className={`mt-3 grid w-full place-items-center rounded-t-lg text-xl font-bold ${height} ${block}`}>
                {place}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Scoreboard({ match }) {
  const top = match.participants[0]?.score || 0;
  return (
    <Card title="Full scoreboard" description="Highest score first." padding={false}>
      <ol className="divide-y divide-slate-100">
        {match.participants.map((entry, index) => (
          <li key={entry.player.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums ${
                index === 0 ? "bg-brand-600 text-brand-fg" : index < 3 ? "bg-brand-50 text-brand-700" : "text-slate-400"
              }`}
            >
              {index + 1}
            </span>
            <Avatar name={entry.player.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-slate-900">{entry.player.name}</p>
                {!entry.player.isActive && <Badge>Inactive</Badge>}
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${top > 0 ? Math.max((entry.score / top) * 100, 2) : 0}%` }}
                />
              </div>
            </div>
            <span className="w-12 text-right text-lg font-semibold text-slate-900 tabular-nums">{formatScore(entry.score)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function EditMatchForm({ match, onSaved, onCancel }) {
  const [opponent, setOpponent] = useState(match.opponent);
  const [selection, setSelection] = useState(() => selectionFromMatch(match));
  const [playerErrors, setPlayerErrors] = useState({});
  const [opponentError, setOpponentError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    if (!opponent.trim()) {
      setOpponentError("Opponent is required");
      return;
    }
    const { participants, errors } = buildParticipants(selection);
    setPlayerErrors(errors);
    if (Object.keys(errors).length) return;
    if (participants.length === 0) {
      setFormError("A match needs at least one player.");
      return;
    }

    setSaving(true);
    const result = await updateMatch(match.id, { opponent: opponent.trim(), participants });
    setSaving(false);
    if (result.ok) {
      onSaved(result.data.match);
      return;
    }
    setPlayerErrors(participantErrorsFrom(result, participants));
    setOpponentError(result.fieldErrors.opponent ?? null);
    setFormError(result.message);
  }

  return (
    <Card padding={false}>
      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="px-5 pt-5 sm:px-6">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <FormSection title="Match details" description="Date and sport can't change after a match is created.">
          <Input
            label="Opponent"
            value={opponent}
            onChange={(e) => {
              setOpponent(e.target.value);
              setOpponentError(null);
            }}
            error={opponentError}
            disabled={saving}
          />
        </FormSection>
        <FormSection title="Players & scores" description="Add or remove eligible players and correct scores.">
          <ParticipantPicker
            date={match.date}
            sport={match.sport}
            selection={selection}
            onChange={(next) => {
              setSelection(next);
              setPlayerErrors({});
            }}
            errors={playerErrors}
            existing={match.participants.map((p) => p.player)}
            disabled={saving}
          />
        </FormSection>
        <FormActions>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </FormActions>
      </form>
    </Card>
  );
}

/** Match header, score summary, scoreboard and edit mode. */
export default function MatchDetails({ matchId }) {
  const { result, reload, setResult } = useApiQuery(`match:${matchId}`, () => getMatch(matchId));
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState(null);

  if (!result) {
    return (
      <>
        <PageHeader title="Match" {...BACK} />
        <LoadingBlock label="Loading match" />
      </>
    );
  }

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Match" {...BACK} />
        {isNotFoundResult(result) ? (
          <NotFoundCard
            title="Match not found"
            description="This match doesn't exist or the link is wrong."
            backHref="/coach/matches"
            backLabel="Back to matches"
          />
        ) : (
          <ErrorState result={result} onRetry={reload} title="Could not load match" />
        )}
      </>
    );
  }

  const { match } = result.data;
  const { summary } = match;
  const average = summary.participants ? formatScore(summary.totalScore / summary.participants) : null;

  return (
    <>
      <PageHeader
        {...BACK}
        title={`vs ${match.opponent}`}
        description={`${match.sport} · ${formatDayLabel(match.date, { weekday: "long" })}`}
        actions={
          !editing && (
            <Button
              variant="secondary"
              icon="pencil"
              onClick={() => {
                setNotice(null);
                setEditing(true);
              }}
            >
              Edit
            </Button>
          )
        }
      />

      {notice && (
        <Alert tone="success" className="mb-6">
          {notice}
        </Alert>
      )}

      {editing ? (
        <EditMatchForm
          match={match}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setResult({ ...result, data: { match: updated } });
            setEditing(false);
            setNotice("Match updated.");
          }}
        />
      ) : (
        <div className="space-y-6">
          <ScoreBanner match={match} average={average} />
          <Podium participants={match.participants} />
          <Scoreboard match={match} />
        </div>
      )}
    </>
  );
}
