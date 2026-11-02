"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import Input from "@/frontend/components/ui/Input";
import Select from "@/frontend/components/ui/Select";
import { register } from "../api/authApi";
import { useAuth } from "../context/AuthProvider";

const ROLE_OPTIONS = [
  { value: "COACH", label: "Coach" },
  { value: "SCOUT", label: "Scout" },
];

const EMPTY = { name: "", email: "", role: "COACH", accessCode: "", password: "", confirmPassword: "" };

/** Coach / Scout self-registration, gated by an access code from the academy. */
export default function RegisterForm() {
  const router = useRouter();
  const { applySession } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    if (values.password !== values.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setSubmitting(true);
    const { name, email, role, accessCode, password } = values;
    const result = await register({ name, email, role, accessCode, password });

    if (result.ok) {
      applySession(result);
      router.replace(result.homePath);
      return;
    }

    setSubmitting(false);
    setFieldErrors(result.fieldErrors);
    // Access-code errors are shown on the field; anything else as a banner.
    if (Object.keys(result.fieldErrors).length === 0) setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="danger">{formError}</Alert>}

      <Input label="Full name" name="name" autoComplete="name" value={values.name} onChange={handleChange} error={fieldErrors.name} disabled={submitting} />
      <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} error={fieldErrors.email} disabled={submitting} />
      <Select label="I am a" name="role" options={ROLE_OPTIONS} value={values.role} onChange={handleChange} error={fieldErrors.role} disabled={submitting} />
      <Input
        label="Access code"
        name="accessCode"
        autoComplete="off"
        hint="Provided by the academy. Required to create a coach or scout account."
        value={values.accessCode}
        onChange={handleChange}
        error={fieldErrors.accessCode}
        disabled={submitting}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        value={values.password}
        onChange={handleChange}
        error={fieldErrors.password}
        disabled={submitting}
      />
      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={handleChange}
        error={fieldErrors.confirmPassword}
        disabled={submitting}
      />

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
