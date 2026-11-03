import PageHeader from "@/frontend/components/layout/PageHeader";
import CoachReadinessBoard from "@/frontend/features/readiness/components/CoachReadinessBoard";

export const metadata = { title: "Readiness" };

export default function CoachReadinessPage() {
  return (
    <>
      <PageHeader
        title="Readiness"
        description="Ready = at least 75% attendance in completed sessions and at least 2 matches played. Calculated live from attendance and match records."
      />
      <CoachReadinessBoard />
    </>
  );
}
