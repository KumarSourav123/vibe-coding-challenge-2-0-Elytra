import MatchDetails from "@/frontend/features/matches/components/MatchDetails";

export const metadata = { title: "Match" };

export default async function MatchPage({ params }) {
  const { id } = await params;
  return <MatchDetails matchId={id} />;
}
