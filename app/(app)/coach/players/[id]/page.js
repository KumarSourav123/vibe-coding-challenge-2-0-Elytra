import PlayerDetails from "@/frontend/features/players/components/PlayerDetails";

export const metadata = { title: "Player" };

export default async function PlayerPage({ params }) {
  const { id } = await params;
  return <PlayerDetails playerId={id} />;
}
