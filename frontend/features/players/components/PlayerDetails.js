"use client";

import { useState } from "react";
import PageHeader from "@/frontend/components/layout/PageHeader";
import Alert from "@/frontend/components/ui/Alert";
import Avatar from "@/frontend/components/ui/Avatar";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import EmptyState from "@/frontend/components/ui/EmptyState";
import ErrorState from "@/frontend/components/ui/ErrorState";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { getPlayer, updatePlayer } from "../api/playersApi";
import PlayerForm from "./PlayerForm";
import PlayerStatusBadges from "./PlayerStatusBadges";
import PlayerPerformanceSection from "@/frontend/features/readiness/components/PlayerPerformanceSection";
import ResetPasswordPanel from "./ResetPasswordPanel";

const BACK = { backHref: "/coach/players", backLabel: "Players" };

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm sm:px-6">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

/** Player profile, login account summary, edit form and password reset. */
export default function PlayerDetails({ playerId }) {
  const { result, reload, setResult } = useApiQuery(`player:${playerId}`, () => getPlayer(playerId));
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState(null);

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
        {result.code === "NOT_FOUND" || result.code === "INVALID_ID" ? (
          <Card>
            <EmptyState
              icon="search"
              title="Player not found"
              description="This player doesn't exist or the link is wrong."
              action={
                <Button href="/coach/players" variant="secondary" size="sm">
                  Back to players
                </Button>
              }
            />
          </Card>
        ) : (
          <ErrorState result={result} onRetry={reload} title="Could not load player" />
        )}
      </>
    );
  }

  const { player } = result.data;
  const updateLocal = (updated) => setResult({ ...result, data: { player: updated } });

  async function handleUpdate(changes) {
    const response = await updatePlayer(player.id, changes);
    if (response.ok) {
      updateLocal(response.data.player);
      setEditing(false);
      setNotice("Changes saved.");
    }
    return response;
  }

  return (
    <>
      <PageHeader
        {...BACK}
        title={
          <span className="flex items-center gap-4">
            <Avatar name={player.name} size="lg" />
            <span className="min-w-0">
              <span className="block truncate">{player.name}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-normal tracking-normal text-slate-500">
                {player.sport} · {player.age} years
                <PlayerStatusBadges player={player} />
              </span>
            </span>
          </span>
        }
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
        <Card padding={false}>
          <PlayerForm
            mode="edit"
            player={player}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Card title="Profile" padding={false}>
              <dl className="divide-y divide-slate-100">
                <DetailRow label="Full name">{player.name}</DetailRow>
                <DetailRow label="Age">{player.age}</DetailRow>
                <DetailRow label="Sport">{player.sport}</DetailRow>
                <DetailRow label="Status">{player.isActive ? "Active" : "Inactive"}</DetailRow>
                <DetailRow label="Added">
                  {new Date(player.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </DetailRow>
              </dl>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card title="Login" padding={false}>
              {player.account ? (
                <dl className="divide-y divide-slate-100">
                  <DetailRow label="Email">
                    <span className="break-all">{player.account.email}</span>
                  </DetailRow>
                  <DetailRow label="Password">
                    {player.account.mustChangePassword ? "Temporary" : "Set by player"}
                  </DetailRow>
                </dl>
              ) : (
                <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">This player has no login account.</p>
              )}
            </Card>
            {player.account && (
              <ResetPasswordPanel
                player={player}
                onReset={(updated) => {
                  setNotice(null);
                  updateLocal(updated);
                }}
              />
            )}
          </div>
        </div>
      )}

      {!editing && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Performance & readiness</h2>
          <PlayerPerformanceSection playerId={player.id} refreshKey={player.updatedAt} />
        </section>
      )}
    </>
  );
}
