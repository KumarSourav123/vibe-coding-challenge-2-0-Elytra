import RoleHome from "@/frontend/features/auth/components/RoleHome";

export const metadata = { title: "Scout" };

const UPCOMING = [
  { label: "Browse Ready players", phase: 6 },
  { label: "Player performance details", phase: 6 },
];

export default function ScoutHomePage() {
  return (
    <RoleHome description="Discover players who meet the academy's readiness standard." upcoming={UPCOMING} />
  );
}
