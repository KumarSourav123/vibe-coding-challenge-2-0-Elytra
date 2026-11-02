import CoachStats from "@/frontend/features/coach/components/CoachStats";
import RoleHome from "@/frontend/features/auth/components/RoleHome";

export const metadata = { title: "Coach" };

const ACTIONS = [
  {
    title: "Practice sessions",
    description: "Create sessions, mark attendance and close them.",
    href: "/coach/sessions",
    icon: "calendar",
  },
  {
    title: "Players",
    description: "Add players, edit profiles and reset passwords.",
    href: "/coach/players",
    icon: "users",
  },
];

const UPCOMING = [
  { label: "Matches and scores", phase: 5 },
  { label: "Performance and readiness dashboard", phase: 6 },
];

export default function CoachHomePage() {
  return (
    <RoleHome description="Here's what's happening across your academy." actions={ACTIONS} upcoming={UPCOMING}>
      <CoachStats />
    </RoleHome>
  );
}
