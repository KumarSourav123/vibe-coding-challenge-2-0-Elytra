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
import Icon from "@/frontend/components/ui/Icon";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import StatCard from "@/frontend/components/ui/StatCard";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { formatDayLabel, formatTimestamp } from "@/frontend/utils/date";
import { getSession } from "../api/sessionsApi";
import AttendanceEditor from "./AttendanceEditor";
import CloseSessionPanel from "./CloseSessionPanel";
import SessionStatusBadge from "./SessionStatusBadge";

const BACK = { backHref: "/coach/sessions", backLabel: "Sessions" };

/** Read-only roster for a CLOSED session. */
function ClosedRoster({ session }) {
  return (
    <Card title="Attendance" description={`Locked ${formatTimestamp(session.closedAt)}`} padding={false}>
      {session.roster.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">No players were eligible for this session.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {session.roster.map((entry) => (
            <li key={entry.player.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
              <Avatar name={entry.player.name} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{entry.player.name}</p>
              <Badge tone={entry.status === "PRESENT" ? "success" : "danger"} dot>
                {entry.status === "PRESENT" ? "Present" : "Absent"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Session header, summary, attendance editor (open) or locked roster (closed). */
export default function SessionDetails({ sessionId }) {
  const { result, reload, setResult } = useApiQuery(`session:${sessionId}`, () => getSession(sessionId));
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState(null);

  if (!result) {
    return (
      <>
        <PageHeader title="Session" {...BACK} />
        <LoadingBlock label="Loading session" />
      </>
    );
  }

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Session" {...BACK} />
        {result.code === "NOT_FOUND" || result.code === "INVALID_ID" ? (
          <Card>
            <EmptyState
              icon="search"
              title="Session not found"
              description="This session doesn't exist or the link is wrong."
              action={
                <Button href="/coach/sessions" variant="secondary" size="sm">
                  Back to sessions
                </Button>
              }
            />
          </Card>
        ) : (
          <ErrorState result={result} onRetry={reload} title="Could not load session" />
        )}
      </>
    );
  }

  const { session } = result.data;
  const isOpen = session.status === "OPEN";
  const { summary } = session;
  const replace = (updated, message) => {
    setResult({ ...result, data: { session: updated } });
    setNotice(message);
  };

  return (
    <>
      <PageHeader
        {...BACK}
        title={formatDayLabel(session.date, { weekday: "long" })}
        description={`${session.sport} practice session`}
        meta={<SessionStatusBadge status={session.status} />}
      />

      {notice && (
        <Alert tone="success" className="mb-6">
          {notice}
        </Alert>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Eligible" icon="users" value={summary.eligible} />
          <StatCard label="Present" icon="checkCircle" value={summary.present} />
          <StatCard label="Absent" icon="xCircle" value={summary.absent} />
          <StatCard label={isOpen ? "Unmarked" : "Status"} icon={isOpen ? "clock" : "lock"} value={isOpen ? summary.unmarked : "Locked"} />
        </div>

        {isOpen && session.roster.length === 0 ? (
          <Card>
            <EmptyState
              icon="users"
              title={`No active ${session.sport} players`}
              description="Players appear here when their sport matches this session and they are active."
              action={
                <Button href="/coach/players/new" icon="plus" size="sm">
                  Add player
                </Button>
              }
            />
          </Card>
        ) : isOpen ? (
          <AttendanceEditor
            key={session.updatedAt}
            session={session}
            onDirtyChange={setDirty}
            onSaved={(updated) => replace(updated, "Attendance saved.")}
          />
        ) : (
          <ClosedRoster session={session} />
        )}

        {isOpen ? (
          <CloseSessionPanel
            session={session}
            dirty={dirty}
            onClosed={(updated) => {
              setDirty(false);
              replace(updated, "Session closed. Attendance is now locked.");
            }}
          />
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Icon name="lock" /> This session is closed and can no longer be changed.
          </p>
        )}
      </div>
    </>
  );
}
