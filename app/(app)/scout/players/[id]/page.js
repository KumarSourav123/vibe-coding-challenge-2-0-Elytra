import ScoutPlayerDetail from "@/frontend/features/readiness/components/ScoutPlayerDetail";

export const metadata = { title: "Player" };

export default async function ScoutPlayerPage({ params }) {
  const { id } = await params;
  return <ScoutPlayerDetail playerId={id} />;
}
