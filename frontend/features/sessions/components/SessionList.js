"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import EmptyState from "@/frontend/components/ui/EmptyState";
import ErrorState from "@/frontend/components/ui/ErrorState";
import Icon from "@/frontend/components/ui/Icon";
import SegmentedControl from "@/frontend/components/ui/SegmentedControl";
import Select from "@/frontend/components/ui/Select";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { formatDayLabel } from "@/frontend/utils/date";
import { listSessions } from "../api/sessionsApi";
import { attendanceLabel } from "../utils/attendanceLabel";
import SessionStatusBadge from "./SessionStatusBadge";
import { buildSportFilterOptions } from "@/frontend/utils/sport";
import { TH_CLASS, TableFooter } from "@/frontend/components/ui/Table";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

function Progress({ session }) {
  const { eligible, unmarked } = session.summary;
  if (session.status === "CLOSED" || eligible === 0) return null;
  const percent = Math.round(((eligible - unmarked) / eligible) * 100);
  return (
    <div className="mt-1.5 h-1 w-24 rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-900" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** Practice sessions, newest first, filterable by status and sport. */
export default function SessionList() {
  const [status, setStatus] = useState("all");
  const [sport, setSport] = useState("");
  const filters = { status, sport };
  const { loading, result, reload } = useApiQuery(JSON.stringify(filters), () => listSessions(filters));

  const sessions = result?.ok ? result.data.sessions : [];
  const hasFilters = status !== "all" || Boolean(sport);
  const sportOptions = buildSportFilterOptions(sessions.map((s) => s.sport), sport);

  return (
    <Card padding={false}>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <SegmentedControl label="Filter by status" options={STATUS_TABS} value={status} onChange={setStatus} />
        <Select aria-label="Sport" options={sportOptions} value={sport} onChange={(e) => setSport(e.target.value)} className="sm:w-44" />
      </div>

      {result && !result.ok ? (
        <div className="p-5">
          <ErrorState result={result} onRetry={reload} title="Could not load sessions" />
        </div>
      ) : !result ? (
        <div className="px-5">
          <LoadingBlock label="Loading sessions" />
        </div>
      ) : sessions.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="search"
            title="No sessions match your filters"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatus("all");
                  setSport("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="calendar"
            title="No sessions yet"
            description="Create a practice session, then mark attendance for every eligible player."
            action={
              <Button href="/coach/sessions/new" icon="plus" size="sm">
                New session
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th scope="col" className={TH_CLASS}>Date</th>
                  <th scope="col" className={TH_CLASS}>Sport</th>
                  <th scope="col" className={TH_CLASS}>Status</th>
                  <th scope="col" className={TH_CLASS}>Attendance</th>
                  <th scope="col" className="w-10 px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <tr key={session.id} className="group relative transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/coach/sessions/${session.id}`}
                        className="font-medium text-slate-900 after:absolute after:inset-0 after:content-['']"
                      >
                        {formatDayLabel(session.date)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{session.sport}</td>
                    <td className="px-5 py-3.5">
                      <SessionStatusBadge status={session.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {attendanceLabel(session)}
                      <Progress session={session} />
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
            {result.data.count} session{result.data.count === 1 ? "" : "s"}
          </TableFooter>
        </>
      )}
    </Card>
  );
}
