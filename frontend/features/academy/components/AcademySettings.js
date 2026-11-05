"use client";

import { useState } from "react";
import PageHeader from "@/frontend/components/layout/PageHeader";
import Alert from "@/frontend/components/ui/Alert";
import Avatar from "@/frontend/components/ui/Avatar";
import Badge from "@/frontend/components/ui/Badge";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import ErrorState from "@/frontend/components/ui/ErrorState";
import Input from "@/frontend/components/ui/Input";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useAuth } from "@/frontend/features/auth/context/AuthProvider";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { getAcademy, regenerateJoinCode, renameAcademy } from "../api/academyApi";

const CODE_INFO = {
  COACH: { key: "coach", title: "Coach join code", help: "Give this to coaches joining your academy." },
  SCOUT: { key: "scout", title: "Scout join code", help: "Give this to scouts. They'll only see your Ready players." },
};

function JoinCodeCard({ role, code, onRegenerated }) {
  const info = CODE_INFO[role];
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    setError(null);
    const result = await regenerateJoinCode(role);
    setBusy(false);
    setConfirming(false);
    if (result.ok) {
      setCopied(false);
      onRegenerated(result.data);
    } else {
      setError(result.message);
    }
  }

  return (
    <Card title={info.title} description={info.help}>
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-lg tracking-widest text-slate-900">
          {code}
        </code>
        <Button variant="secondary" size="sm" icon={copied ? "check" : "copy"} onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {confirming ? (
        <div className="mt-4 space-y-3">
          <Alert tone="warning" title="Replace this code?">
            The current code will stop working immediately. People who already joined are not affected.
          </Alert>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" icon="refresh" onClick={regenerate} disabled={busy}>
              {busy ? "Generating..." : "Generate new code"}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" icon="refresh" className="mt-3" onClick={() => setConfirming(true)}>
          Generate a new code
        </Button>
      )}
    </Card>
  );
}

function RenameForm({ academy, onSaved }) {
  const [name, setName] = useState(academy.name);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const changed = name.trim() !== academy.name;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await renameAcademy(name.trim());
    setSaving(false);
    if (result.ok) onSaved(result.data);
    else setError(result.fieldErrors.name ?? result.message);
  }

  return (
    <Card title="Academy name" description="Shown to everyone in your academy.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Input aria-label="Academy name" placeholder="e.g. Delhi Cricket Academy" value={name} onChange={(e) => setName(e.target.value)} error={error} className="flex-1" disabled={saving} />
        <Button type="submit" disabled={saving || !changed}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </form>
    </Card>
  );
}

/** Academy overview for coaches; the Head Coach also manages the name and join codes. */
export default function AcademySettings() {
  const { refresh } = useAuth();
  const { result, reload, setResult } = useApiQuery("academy", () => getAcademy());
  const [notice, setNotice] = useState(null);

  if (!result) {
    return (
      <>
        <PageHeader title="Academy" />
        <LoadingBlock label="Loading academy" />
      </>
    );
  }
  if (!result.ok) {
    return (
      <>
        <PageHeader title="Academy" />
        <ErrorState result={result} onRetry={reload} title="Could not load your academy" />
      </>
    );
  }

  const { academy, members, joinCodes } = result.data;
  const update = (data, message) => {
    setResult({ ...result, data });
    setNotice(message);
  };

  return (
    <>
      <PageHeader
        title={academy.name}
        description="Your academy's data is private: other academies can't see your players, sessions, matches or readiness."
      />

      {notice && (
        <Alert tone="success" className="mb-6">
          {notice}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {joinCodes ? (
            <>
              <RenameForm
                key={academy.name}
                academy={academy}
                onSaved={(data) => {
                  update(data, "Academy name updated.");
                  refresh(); // the sidebar shows the academy name
                }}
              />
              <JoinCodeCard role="COACH" code={joinCodes.coach} onRegenerated={(data) => update(data, "New coach join code generated.")} />
              <JoinCodeCard role="SCOUT" code={joinCodes.scout} onRegenerated={(data) => update(data, "New scout join code generated.")} />
            </>
          ) : (
            <Alert tone="info" title="Join codes are managed by your Head Coach">
              Ask your academy&apos;s Head Coach for the code to invite another coach or a scout.
            </Alert>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card title="Coaches & scouts" description={`${members.length} member${members.length === 1 ? "" : "s"}. Players are under Players.`} padding={false}>
            <ul className="divide-y divide-slate-100">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <Avatar name={member.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                  </div>
                  {member.isHeadCoach ? (
                    <Badge tone="info">Head Coach</Badge>
                  ) : (
                    <Badge>{member.role === "COACH" ? "Coach" : "Scout"}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
