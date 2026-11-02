import PageHeader from "@/frontend/components/layout/PageHeader";
import Card from "@/frontend/components/ui/Card";
import ChangePasswordForm from "@/frontend/features/auth/components/ChangePasswordForm";

export const metadata = { title: "Change password" };

export default function ChangePasswordPage() {
  return (
    <div className="max-w-xl">
      <PageHeader
        title="Password"
        description="Choose a password only you know. Changing it signs you out on your other devices."
      />
      <Card>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
