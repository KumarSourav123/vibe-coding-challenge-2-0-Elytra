import AuthCard, { AuthFooterLink } from "@/frontend/features/auth/components/AuthCard";
import RegisterForm from "@/frontend/features/auth/components/RegisterForm";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="For coaches and scouts, with the access code from your academy. Players get their login from their coach."
      footer={<AuthFooterLink prompt="Already have an account?" href="/login" label="Sign in" />}
    >
      <RegisterForm />
    </AuthCard>
  );
}
