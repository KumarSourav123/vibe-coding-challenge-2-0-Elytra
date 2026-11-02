import PageHeader from "@/frontend/components/layout/PageHeader";
import CreatePlayer from "@/frontend/features/players/components/CreatePlayer";

export const metadata = { title: "Add player" };

export default function NewPlayerPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        backHref="/coach/players"
        backLabel="Players"
        title="Add player"
        description="Creates the player's profile and login together. You'll get the details to share once it's saved."
      />
      <CreatePlayer />
    </div>
  );
}
