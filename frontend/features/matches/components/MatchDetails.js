"use client";

import { useState } from "react";
import PageHeader from "@/frontend/components/layout/PageHeader";
import Alert from "@/frontend/components/ui/Alert";
import Avatar from "@/frontend/components/ui/Avatar";
import Badge from "@/frontend/components/ui/Badge";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import EmptyState from "@/frontend/components/ui/EmptyState";
import ErrorState from "@/frontend/components/ui/ErrorState";
import FormSection, { FormActions } from "@/frontend/components/ui/FormSection";
import Input from "@/frontend/components/ui/Input";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import StatCard from "@/frontend/components/ui/StatCard";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { formatDayLabel } from "@/frontend/utils/date";
import { getMatch, updateMatch } from "../api/matchesApi";
import { buildParticipants, participantErrorsFrom, selectionFromMatch } from "../utils/participants";
import ParticipantPicker from "./ParticipantPicker";

const BACK = { backHref: "/coach/matches", backLabel: "Matches" };

const formatScore = (n) => (Number.isInteger(n) ? n : Number(n.toFixed(2)));

function Scoreboard({ match }) {
  return (
    <Card title="Scores" description="Highest score first." padding={false}>
      <ol className="divide-y divide-slate-100">
        {match.participants.map((entry, index) => (
          <li key={entry.player.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
            <span className="w-5 text-right text-sm font-medium text-slate-400 tabular-nums">{index + 1}</span>
            <Avatar name={entry.player.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{entry.player.name}</p>
              {!entry.player.isActive && <Badge className="mt-0.5">Inactive</Badge>}
            </div>
            <span className="text-lg font-semibold text-slate-900 tabular-nums">{formatScore(entry.score)}</span>
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
        {result.code === "NOT_FOUND" || result.code === "INVALID_ID" ? (
          <Card>
            <EmptyState
              icon="search"
              title="Match not found"
              description="This match doesn't exist or the link is wrong."
              action={
                <Button href="/coach/matches" variant="secondary" size="sm">
                  Back to matches
                </Button>
              }
            />
          </Card>
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Players" icon="users" value={summary.participants} />
            <StatCard label="Total score" icon="activity" value={formatScore(summary.totalScore)} />
            <StatCard
              label="Top score"
              icon="trophy"
              value={summary.topScore != null ? formatScore(summary.topScore) : "—"}
              hint={summary.topScorer?.name}
            />
            <StatCard label="Average" icon="target" value={average ?? "—"} />
          </div>
          <Scoreboard match={match} />
        </div>
      )}
    </>
  );
}
