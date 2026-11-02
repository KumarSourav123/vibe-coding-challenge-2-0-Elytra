"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import Input from "@/frontend/components/ui/Input";
import Spinner from "@/frontend/components/ui/Spinner";
import { changePassword } from "../api/authApi";
import { useAuth } from "../context/AuthProvider";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

/**
 * Change your own password. Required on first login for accounts created by
 * a Coach (temporary password); available to everyone from the user menu.
 */
export default function ChangePasswordForm() {
  const router = useRouter();
  const { status, user, applySession } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Spinner label="Loading" /> Loading...
      </div>
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    if (values.newPassword !== values.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setSubmitting(true);
    const result = await changePassword(values);

    if (result.ok) {
      applySession(result);
      router.replace(result.homePath);
      return;
    }

    setSubmitting(false);
    setFieldErrors(result.fieldErrors);
    if (Object.keys(result.fieldErrors).length === 0) setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {user?.mustChangePassword && (
        <Alert tone="info" title="Choose your own password">
          Your account was created with a temporary password. Set a new one to continue.
        </Alert>
      )}
      {formError && <Alert tone="danger">{formError}</Alert>}

      <Input
        label={user?.mustChangePassword ? "Temporary password" : "Current password"}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={handleChange}
        error={fieldErrors.currentPassword}
        disabled={submitting}
      />
      <Input
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters. You'll be signed out on other devices."
        value={values.newPassword}
        onChange={handleChange}
        error={fieldErrors.newPassword}
        disabled={submitting}
      />
      <Input
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={handleChange}
        error={fieldErrors.confirmPassword}
        disabled={submitting}
      />

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}
