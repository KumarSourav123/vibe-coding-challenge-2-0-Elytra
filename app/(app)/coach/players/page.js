import PageHeader from "@/frontend/components/layout/PageHeader";
import Button from "@/frontend/components/ui/Button";
import PlayerList from "@/frontend/features/players/components/PlayerList";

export const metadata = { title: "Players" };

export default function PlayersPage() {
  return (
    <>
      <PageHeader
        title="Players"
        description="Everyone in the academy. Open a player to edit details or reset their password."
        actions={
          <Button href="/coach/players/new" icon="plus">
            Add player
          </Button>
        }
      />
      <PlayerList />
    </>
  );
}
