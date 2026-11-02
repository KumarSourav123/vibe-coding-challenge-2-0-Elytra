import PageHeader from "@/frontend/components/layout/PageHeader";
import CreateSessionForm from "@/frontend/features/sessions/components/CreateSessionForm";

export const metadata = { title: "New session" };

export default function NewSessionPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        backHref="/coach/sessions"
        backLabel="Sessions"
        title="New practice session"
        description="Every active player of this sport will be on the session's attendance roster."
      />
      <CreateSessionForm />
    </div>
  );
}
