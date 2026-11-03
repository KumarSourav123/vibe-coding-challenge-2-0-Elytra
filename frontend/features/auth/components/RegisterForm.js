"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import Input from "@/frontend/components/ui/Input";
import SegmentedControl from "@/frontend/components/ui/SegmentedControl";
import Spinner from "@/frontend/components/ui/Spinner";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { useDebouncedValue } from "@/frontend/hooks/useDebouncedValue";
import { lookupJoinCode, register, registerAcademy } from "../api/authApi";
import EvaluationPanel from "@/frontend/features/evaluation/components/EvaluationPanel";
import { useAuth } from "../context/AuthProvider";
import { ROLE_LABELS } from "../data/roleLabels";

const MODES = [
  { value: "create", label: "Create an academy" },
  { value: "join", label: "Join an academy" },
];

const EMPTY = { academyName: "", joinCode: "", name: "", email: "", password: "", confirmPassword: "" };

/** A code is worth looking up once it has 12 letters/digits. */
const looksComplete = (code) => code.replace(/[^a-z0-9]/gi, "").length === 12;

/** Live preview: "You're joining Delhi Cricket Academy as a Coach". */
function JoinCodePreview({ code }) {
  const debounced = useDebouncedValue(code.trim(), 400);
  const ready = looksComplete(debounced);
  const { loading, result } = useApiQuery(`join-code:${ready ? debounced : ""}`, () =>
    ready ? lookupJoinCode(debounced) : Promise.resolve(null)
  );

  if (!ready) return null;
  if (loading || !result) {
    return (
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Spinner className="h-3 w-3" label="Checking code" /> Checking code...
      </p>
    );
  }
  if (!result.ok) return <p className="text-xs text-rose-600">This join code doesn&apos;t match any academy.</p>;
  return (
    <Alert tone="success">
      You&apos;re joining <strong>{result.data.academy.name}</strong> as a{" "}
      <strong>{ROLE_LABELS[result.data.role]}</strong>.
    </Alert>
  );
}

/**
 * Create a new academy (you become its Head Coach), or join an existing one
 * with the join code your Head Coach gave you. Players don't sign up here.
 */
export default function RegisterForm() {
  const router = useRouter();
  const { applySession } = useAuth();
  const [mode, setMode] = useState("create");
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isCreate = mode === "create";

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function switchMode(next) {
    setMode(next);
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    if (values.password !== values.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setSubmitting(true);
    const person = { name: values.name, email: values.email, password: values.password };
    const result = isCreate
      ? await registerAcademy({ academyName: values.academyName, ...person })
      : await register({ joinCode: values.joinCode, ...person });

    if (result.ok) {
      applySession(result);
      router.replace(result.homePath);
      return;
    }

    setSubmitting(false);
    setFieldErrors(result.fieldErrors);
    if (Object.keys(result.fieldErrors).length === 0) setFormError(result.message);
  }

  const field = (name, props) => ({
    name,
    value: values[name],
    onChange: (e) => setField(name, e.target.value),
    error: fieldErrors[name],
    disabled: submitting,
    ...props,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <SegmentedControl label="Account type" options={MODES} value={mode} onChange={switchMode} fullWidth />

      <p className="text-sm text-slate-500">
        {isCreate
          ? "Start a new academy. You'll be its Head Coach and get join codes for your coaches and scouts."
          : "Use the join code from your academy's Head Coach. The code decides whether you join as a coach or a scout."}
      </p>

      {formError && <Alert tone="danger">{formError}</Alert>}

      {isCreate ? (
        <Input label="Academy name" placeholder="e.g. Delhi Cricket Academy" {...field("academyName", { autoComplete: "organization" })} />
      ) : (
        <div className="space-y-2">
          <EvaluationPanel variant="join" onUseCode={(code) => setField("joinCode", code)} />
          <Input
            label="Join code"
            placeholder="XXXX-XXXX-XXXX"
            {...field("joinCode", { autoComplete: "off", autoCapitalize: "characters", spellCheck: false })}
          />
          <JoinCodePreview code={values.joinCode} />
        </div>
      )}

      <Input label="Your full name" {...field("name", { autoComplete: "name" })} />
      <Input label="Email" type="email" {...field("email", { autoComplete: "email" })} />
      <Input label="Password" type="password" hint="At least 8 characters." {...field("password", { autoComplete: "new-password" })} />
      <Input label="Confirm password" type="password" {...field("confirmPassword", { autoComplete: "new-password" })} />

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Creating account..." : isCreate ? "Create academy" : "Join academy"}
      </Button>
    </form>
  );
}
