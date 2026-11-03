import CoachStats from "@/frontend/features/coach/components/CoachStats";
import RoleHome from "@/frontend/features/auth/components/RoleHome";

export const metadata = { title: "Coach" };

const ACTIONS = [
  {
    title: "Readiness",
    description: "See who meets 75% attendance and 2 matches, and what the rest still need.",
    href: "/coach/readiness",
    icon: "target",
  },
  {
    title: "Practice sessions",
    description: "Create sessions, mark attendance and close them.",
    href: "/coach/sessions",
    icon: "calendar",
  },
  {
    title: "Matches",
    description: "Record a match with the day's present players and their scores.",
    href: "/coach/matches",
    icon: "trophy",
  },
  {
    title: "Players",
    description: "Add players, edit profiles and reset passwords.",
    href: "/coach/players",
    icon: "users",
  },
];

export default function CoachHomePage() {
  return (
    <RoleHome description="Here's what's happening across your academy." actions={ACTIONS}>
      <CoachStats />
    </RoleHome>
  );
}
