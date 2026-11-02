"use client";

import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Avatar from "@/frontend/components/ui/Avatar";
import Badge from "@/frontend/components/ui/Badge";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import { cn } from "@/frontend/utils/cn";
import { markAttendance } from "../api/sessionsApi";

const OPTIONS = [
  { value: "PRESENT", label: "Present", active: "bg-emerald-600 text-white ring-emerald-600" },
  { value: "ABSENT", label: "Absent", active: "bg-rose-600 text-white ring-rose-600" },
];

function StatusToggle({ name, value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label={`Attendance for ${name}`} className="inline-flex gap-1.5">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-medium ring-1 ring-inset transition-colors disabled:opacity-50",
              selected ? option.active : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Mark PRESENT/ABSENT for an OPEN session. Changes are kept locally until
 * "Save attendance"; only changed rows are sent. Re-mount (key) after a save
 * to reset the draft from the server's roster.
 */
export default function AttendanceEditor({ session, onSaved, onDirtyChange }) {
  const saved = Object.fromEntries(session.roster.map((r) => [r.player.id, r.status]));
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const editable = session.roster.filter((r) => r.eligible);
  const changed = editable.filter((r) => draft[r.player.id] && draft[r.player.id] !== saved[r.player.id]);
  const counts = {
    present: editable.filter((r) => draft[r.player.id] === "PRESENT").length,
    absent: editable.filter((r) => draft[r.player.id] === "ABSENT").length,
  };
  const unmarked = editable.length - counts.present - counts.absent;

  function update(next) {
    setDraft(next);
    setError(null);
    const dirty = editable.some((r) => next[r.player.id] && next[r.player.id] !== saved[r.player.id]);
    onDirtyChange?.(dirty);
  }

  function markAll(status) {
    update({ ...draft, ...Object.fromEntries(editable.map((r) => [r.player.id, status])) });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await markAttendance(
      session.id,
      changed.map((r) => ({ playerId: r.player.id, status: draft[r.player.id] }))
    );
    setSaving(false);
    if (result.ok) {
      onDirtyChange?.(false);
      onSaved(result.data.session);
      return;
    }
    setError(result.errors.length > 1 ? result.errors.map((e) => e.message).join(". ") : result.message);
  }

  return (
    <Card
      title="Attendance"
      description={`${counts.present} present · ${counts.absent} absent · ${unmarked} unmarked`}
      action={
        editable.length > 0 && (
          <>
            <Button variant="ghost" size="sm" onClick={() => markAll("PRESENT")} disabled={saving}>
              All present
            </Button>
            {changed.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => update(saved)} disabled={saving}>
                Undo changes
              </Button>
            )}
          </>
        )
      }
      padding={false}
    >
      {error && (
        <div className="px-5 pt-4 sm:px-6">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <ul className="divide-y divide-slate-100">
        {session.roster.map((entry) => {
          const id = entry.player.id;
          const isChanged = entry.eligible && draft[id] && draft[id] !== saved[id];
          return (
            <li key={id} className={cn("flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6", isChanged && "bg-amber-50/40")}>
              <Avatar name={entry.player.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{entry.player.name}</p>
                <p className="text-xs text-slate-500">
                  {entry.player.age != null && `${entry.player.age} yrs`}
                  {isChanged && <span className="ml-2 text-amber-700">Unsaved</span>}
                </p>
              </div>
              {entry.eligible ? (
                <StatusToggle
                  name={entry.player.name}
                  value={draft[id]}
                  onChange={(status) => update({ ...draft, [id]: status })}
                  disabled={saving}
                />
              ) : (
                <span className="flex items-center gap-2">
                  <Badge tone={entry.status === "PRESENT" ? "success" : "danger"}>
                    {entry.status === "PRESENT" ? "Present" : "Absent"}
                  </Badge>
                  <Badge>No longer eligible</Badge>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur sm:px-6">
        <p className="text-sm text-slate-500">
          {changed.length > 0
            ? `${changed.length} unsaved change${changed.length === 1 ? "" : "s"}`
            : "All changes saved"}
        </p>
        <Button onClick={handleSave} disabled={saving || changed.length === 0}>
          {saving ? "Saving..." : "Save attendance"}
        </Button>
      </div>
    </Card>
  );
}
