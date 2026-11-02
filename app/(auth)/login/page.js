import { Suspense } from "react";
import AuthCard, { AuthFooterLink } from "@/frontend/features/auth/components/AuthCard";
import LoginForm from "@/frontend/features/auth/components/LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your academy account. You'll land in your own area."
      footer={<AuthFooterLink prompt="Coach or scout without an account?" href="/register" label="Create one" />}
    >
      {/* useSearchParams (for ?next=) needs a Suspense boundary. */}
      <Suspense>
        <LoginForm />
      </Suspense>
      {process.env.NODE_ENV !== "production" && (
        <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
          Development: <code className="font-mono text-slate-700">npm run seed</code> creates coach@, player@ and
          scout@academy.test with your SEED_PASSWORD.
        </p>
      )}
    </AuthCard>
  );
}
