import { Suspense } from "react";
import AuthCard, { AuthFooterLink } from "@/frontend/features/auth/components/AuthCard";
import LoginForm from "@/frontend/features/auth/components/LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your academy account. You'll land in your own area."
      footer={<AuthFooterLink prompt="New here?" href="/register" label="Create or join an academy" />}
    >
      {/* useSearchParams (for ?next=) needs a Suspense boundary. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
