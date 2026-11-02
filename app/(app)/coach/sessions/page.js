import PageHeader from "@/frontend/components/layout/PageHeader";
import Button from "@/frontend/components/ui/Button";
import SessionList from "@/frontend/features/sessions/components/SessionList";

export const metadata = { title: "Sessions" };

export default function SessionsPage() {
  return (
    <>
      <PageHeader
        title="Practice sessions"
        description="Create a session, mark every eligible player present or absent, then close it to lock attendance."
        actions={
          <Button href="/coach/sessions/new" icon="plus">
            New session
          </Button>
        }
      />
      <SessionList />
    </>
  );
}
