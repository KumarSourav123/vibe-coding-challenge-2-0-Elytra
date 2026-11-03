import PageHeader from "@/frontend/components/layout/PageHeader";
import Button from "@/frontend/components/ui/Button";
import MatchList from "@/frontend/features/matches/components/MatchList";

export const metadata = { title: "Matches" };

export default function MatchesPage() {
  return (
    <>
      <PageHeader
        title="Matches"
        description="Record matches and individual scores. Players must be present in that day's closed practice session."
        actions={
          <Button href="/coach/matches/new" icon="plus">
            New match
          </Button>
        }
      />
      <MatchList />
    </>
  );
}
