"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import Input from "@/frontend/components/ui/Input";
import Spinner from "@/frontend/components/ui/Spinner";
import EvaluationPanel from "@/frontend/features/evaluation/components/EvaluationPanel";
import { useAuth } from "../context/AuthProvider";
import { CHANGE_PASSWORD_PATH } from "../data/paths";

/** Only follow ?next= when it points inside the user's own area. */
function resolveDestination(next, homePath) {
  if (!next || !homePath) return homePath ?? "/";
  const insideHome = next === homePath || next.startsWith(`${homePath}/`) || next.startsWith(`${homePath}?`);
  return insideHome ? next : homePath;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const missing = {};
    if (!values.email.trim()) missing.email = "Email is required";
    if (!values.password) missing.password = "Password is required";
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }

    setSubmitting(true);
    const result = await signIn({ email: values.email.trim(), password: values.password });

    if (result.ok) {
      router.replace(
        result.user.mustChangePassword
          ? CHANGE_PASSWORD_PATH
          : resolveDestination(searchParams.get("next"), result.homePath)
      );
      return;
    }

    setSubmitting(false);
    setFieldErrors(result.fieldErrors);
    if (Object.keys(result.fieldErrors).length === 0) setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <EvaluationPanel
        variant="login"
        onUseAccount={(credentials) => {
          setValues(credentials);
          setFieldErrors({});
          setFormError(null);
        }}
      />
      {formError && <Alert tone="danger">{formError}</Alert>}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="e.g. coach@academy.test"
        hint="Demo logins end in @academy.test (coach@, scout@, player@). Accounts you sign up with can use any email."
        value={values.email}
        onChange={handleChange}
        error={fieldErrors.email}
        disabled={submitting}
      />

      <div>
        <Input
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          error={fieldErrors.password}
          disabled={submitting}
        />
        <button
          type="button"
          onClick={() => setShowPassword((shown) => !shown)}
          className="mt-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          {showPassword ? "Hide password" : "Show password"}
        </button>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Spinner label="Signing in" className="border-white/40 border-t-white" /> Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
