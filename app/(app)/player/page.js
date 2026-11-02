import RoleHome from "@/frontend/features/auth/components/RoleHome";

export const metadata = { title: "Player" };

const UPCOMING = [
  { label: "Your profile", phase: 6 },
  { label: "Your attendance", phase: 6 },
  { label: "Your match history", phase: 6 },
  { label: "Your readiness status", phase: 6 },
];

export default function PlayerHomePage() {
  return (
    <RoleHome
      description="Follow your attendance, matches and readiness. Only you can see your records."
      upcoming={UPCOMING}
    />
  );
}
