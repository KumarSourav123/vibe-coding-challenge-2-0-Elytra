import SessionDetails from "@/frontend/features/sessions/components/SessionDetails";

export const metadata = { title: "Session" };

export default async function SessionPage({ params }) {
  const { id } = await params;
  return <SessionDetails sessionId={id} />;
}
