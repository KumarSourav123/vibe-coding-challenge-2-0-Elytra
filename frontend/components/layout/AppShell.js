"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "@/frontend/components/ui/Avatar";
import Icon from "@/frontend/components/ui/Icon";
import Logo from "@/frontend/components/ui/Logo";
import { useAuth } from "@/frontend/features/auth/context/AuthProvider";
import { ROLE_LABELS } from "@/frontend/features/auth/data/roleLabels";
import { tourGroupFor } from "@/frontend/features/onboarding/data/tourSteps";
import { replayTourGroup } from "@/frontend/features/onboarding/onboardingStore";
import { cn } from "@/frontend/utils/cn";
import { ACCOUNT_NAV, isNavItemActive, NAV_BY_ROLE } from "./navigation";

function NavLink({ item, pathname, onNavigate }) {
  const active = isNavItemActive(item, pathname);

  if (item.soon) {
    return (
      <span
        aria-disabled="true"
        className="flex h-9 cursor-default items-center gap-3 rounded-lg px-3 text-sm text-slate-400"
      >
        <Icon name={item.icon} />
        <span className="flex-1">{item.label}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
          Soon
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
        active
          ? "bg-brand-50 font-medium text-brand-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon name={item.icon} className={active ? "text-brand-600" : "text-slate-400"} />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, homePath, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  // Users with a temporary password can only change it; hide the rest of the app.
  const restricted = user?.mustChangePassword;
  const mainNav = user && !restricted ? NAV_BY_ROLE[user.role] ?? [] : [];

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo href={homePath && !restricted ? homePath : "/"} />
      </div>

      {user?.academy && (
        <div className="mx-3 mb-1 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2.5">
          <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Academy</p>
          <p className="truncate text-sm font-semibold text-slate-900" title={user.academy.name}>
            {user.academy.name}
          </p>
        </div>
      )}

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {status === "loading" ? (
          <div className="space-y-2 px-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <>
            {mainNav.length > 0 && (
              <div className="space-y-1">
                {mainNav.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                ))}
              </div>
            )}
            {user && (
              <div>
                <p className="px-3 pb-2 text-xs font-medium tracking-wide text-slate-400 uppercase">Account</p>
                <div className="space-y-1">
                  {ACCOUNT_NAV.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate?.();
                      const group = tourGroupFor(pathname);
                      if (group) {
                        replayTourGroup(group.id);
                      } else if (homePath) {
                        // No steps for this page: replay the dashboard tour there.
                        replayTourGroup(tourGroupFor(homePath)?.id);
                        router.push(homePath);
                      }
                    }}
                    className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Icon name="sparkle" className="text-slate-400" />
                    Tutorial
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </nav>

      {user && (
        <div className="border-t border-slate-200/70 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">
                {user.isHeadCoach ? "Head Coach" : (ROLE_LABELS[user.role] ?? user.role)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              title="Log out"
            >
              <Icon name="logout" label="Log out" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Layout for signed-in areas: fixed sidebar on desktop, top bar + slide-over
 * menu on mobile. Navigation is chosen from the signed-in user's role.
 */
export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/70 bg-white lg:block">
        <SidebarContent />
      </aside>

      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-md lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-raised">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <Icon name="close" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
