import PageHeader from "@/frontend/components/layout/PageHeader";
import ScoutPlayerList from "@/frontend/features/readiness/components/ScoutPlayerList";

export const metadata = { title: "Ready players" };

export default function ScoutHomePage() {
  return (
    <>
      <PageHeader
        title="Ready players"
        description="Players with at least 75% attendance and 2 or more matches played. Only Ready players are shown."
      />
      <ScoutPlayerList />
    </>
  );
}
