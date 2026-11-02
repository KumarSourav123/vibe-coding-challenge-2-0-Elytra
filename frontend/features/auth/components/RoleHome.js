"use client";

import Link from "next/link";
import PageHeader from "@/frontend/components/layout/PageHeader";
import Alert from "@/frontend/components/ui/Alert";
import Badge from "@/frontend/components/ui/Badge";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import Icon from "@/frontend/components/ui/Icon";
import { LoadingBlock } from "@/frontend/components/ui/Spinner";
import { useAuth } from "../context/AuthProvider";

const firstName = (name = "") => name.trim().split(/\s+/)[0] ?? "";

/** Quick-link tiles shown on an overview page. */
export function ActionTiles({ actions }) {
  if (!actions?.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group flex items-start gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition-all hover:border-slate-300 hover:shadow-raised"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
            <Icon name={action.icon} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
              {action.title}
              <Icon name="arrowRight" className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </span>
            <span className="mt-1 block text-sm text-slate-500">{action.description}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** "Coming next" roadmap list. */
export function UpcomingCard({ items }) {
  return (
    <Card title="Coming next" description="Features arriving in upcoming phases." padding={false}>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm sm:px-6">
            <span className="text-slate-700">{item.label}</span>
            <Badge>Phase {item.phase}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Overview page for a signed-in role. proxy.js already ensures only the right
 * role reaches it; `children` renders between the header and the roadmap.
 */
export default function RoleHome({ description, actions = [], upcoming, children }) {
  const { status, user, message, refresh } = useAuth();

  if (status === "loading") return <LoadingBlock label="Loading your account" />;

  if (status === "error") {
    return (
      <Alert tone="danger" title="Could not load your account">
        <p>{message}</p>
        <Button variant="secondary" size="sm" icon="refresh" className="mt-3" onClick={refresh}>
          Try again
        </Button>
      </Alert>
    );
  }

  if (status !== "authenticated") {
    return (
      <Alert tone="warning" title="Your session has ended">
        <p>Please sign in again to continue.</p>
        <Button href="/login" size="sm" className="mt-3">
          Sign in
        </Button>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName(user.name)}`} description={description} />
      <div className="space-y-8">
        {children}
        <ActionTiles actions={actions} />
        {upcoming?.length > 0 && <UpcomingCard items={upcoming} />}
      </div>
    </>
  );
}
