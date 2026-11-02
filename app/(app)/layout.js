import AppShell from "@/frontend/components/layout/AppShell";

/** Signed-in areas (/coach, /player, /scout, /account). Access is enforced by proxy.js and the APIs. */
export default function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
