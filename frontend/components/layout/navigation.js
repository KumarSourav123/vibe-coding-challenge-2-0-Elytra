// Sidebar navigation per role. `soon` items are shown disabled until their phase ships.
// `exact` marks overview links so they don't stay active on sub-pages.
export const NAV_BY_ROLE = {
  COACH: [
    { href: "/coach", label: "Overview", icon: "overview", exact: true },
    { href: "/coach/players", label: "Players", icon: "users" },
    { href: "/coach/sessions", label: "Sessions", icon: "calendar" },
    { href: "/coach/matches", label: "Matches", icon: "trophy" },
    { href: "/coach/readiness", label: "Readiness", icon: "target" },
  ],
  PLAYER: [{ href: "/player", label: "My dashboard", icon: "overview", exact: true }],
  SCOUT: [{ href: "/scout", label: "Ready players", icon: "target" }],
};

export const ACCOUNT_NAV = [{ href: "/account/password", label: "Password", icon: "key" }];

export function isNavItemActive(item, pathname) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
