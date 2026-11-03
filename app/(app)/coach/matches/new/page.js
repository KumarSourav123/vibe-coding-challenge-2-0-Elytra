import PageHeader from "@/frontend/components/layout/PageHeader";
import CreateMatchForm from "@/frontend/features/matches/components/CreateMatchForm";

export const metadata = { title: "New match" };

export default function NewMatchPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        backHref="/coach/matches"
        backLabel="Matches"
        title="New match"
        description="Pick the date and sport, then select the players who were present and enter their scores."
      />
      <CreateMatchForm />
    </div>
  );
}
