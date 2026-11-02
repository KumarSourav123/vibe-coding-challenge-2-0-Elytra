"use client";

import Button from "@/frontend/components/ui/Button";
import { useAuth } from "../context/AuthProvider";

/** Public header action: "Sign in", or a shortcut into the app for signed-in users. */
export default function UserMenu() {
  const { status, homePath } = useAuth();

  if (status === "loading") {
    return <span aria-hidden="true" className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />;
  }

  if (status === "authenticated") {
    return (
      <Button href={homePath} size="md" iconRight="arrowRight">
        Open dashboard
      </Button>
    );
  }

  return (
    <Button href="/login" variant="secondary">
      Sign in
    </Button>
  );
}
