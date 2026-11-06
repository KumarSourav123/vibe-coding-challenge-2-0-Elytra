"use client";

import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import FormSection, { FormActions } from "@/frontend/components/ui/FormSection";
import Input from "@/frontend/components/ui/Input";
import Switch from "@/frontend/components/ui/Switch";
import { generateTemporaryPassword } from "../utils/generatePassword";
import { COMMON_SPORTS } from "@/frontend/utils/sport";

const SPORTS_LIST_ID = "player-sport-options";

function toFormValues(player) {
  return {
    name: player?.name ?? "",
    age: player?.age != null ? String(player.age) : "",
    sport: player?.sport ?? "",
    email: player?.account?.email ?? "",
    temporaryPassword: "",
    isActive: player?.isActive ?? true,
  };
}

/**
 * Create or edit a player, laid out as settings-style sections.
 * - mode "create": also asks for a temporary password (with a generator).
 * - mode "edit": sends only changed fields, and offers the Active switch.
 * `onSubmit(payload)` must resolve to an apiRequest result; field errors from
 * the server are shown next to their inputs. Render inside <Card padding={false}>.
 */
export default function PlayerForm({ mode, player, onSubmit, onCancel, submitLabel }) {
  const [values, setValues] = useState(() => toFormValues(player));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isCreate = mode === "create";
  const hasLogin = isCreate || Boolean(player?.account);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function buildPayload() {
    const payload = {
      name: values.name.trim(),
      age: values.age === "" ? undefined : Number(values.age),
      sport: values.sport.trim(),
      email: values.email.trim(),
    };
    if (isCreate) return { ...payload, temporaryPassword: values.temporaryPassword };

    // Edit: only send what changed.
    const original = toFormValues(player);
    const changes = {};
    if (payload.name !== original.name) changes.name = payload.name;
    if (values.age !== original.age) changes.age = payload.age;
    if (payload.sport !== original.sport) changes.sport = payload.sport;
    if (player.account && payload.email !== original.email) changes.email = payload.email;
    if (values.isActive !== original.isActive) changes.isActive = values.isActive;
    return changes;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const required = { name: "Name", age: "Age", sport: "Sport" };
    if (hasLogin) required.email = "Email";
    if (isCreate) required.temporaryPassword = "Temporary password";
    const missing = {};
    for (const [field, label] of Object.entries(required)) {
      if (String(values[field]).trim() === "") missing[field] = `${label} is required`;
    }
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }

    const payload = buildPayload();
    if (!isCreate && Object.keys(payload).length === 0) {
      onCancel?.();
      return;
    }

    setSubmitting(true);
    const result = await onSubmit(payload, values);
    setSubmitting(false);
    if (result.ok) return;

    setFieldErrors(result.fieldErrors);
    if (Object.keys(result.fieldErrors).length === 0) setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="px-5 pt-5 sm:px-6">
          <Alert tone="danger">{formError}</Alert>
        </div>
      )}

      <FormSection title="Profile" description="Basic details used across sessions, matches and readiness.">
        <Input
          label="Full name"
          placeholder="e.g. Asha Rao"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          error={fieldErrors.name}
          disabled={submitting}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Age"
            type="number"
            inputMode="numeric"
            min={5}
            max={60}
            value={values.age}
            onChange={(e) => setField("age", e.target.value)}
            error={fieldErrors.age}
            disabled={submitting}
          />
          <div>
            <Input
              label="Sport"
              list={SPORTS_LIST_ID}
              placeholder="e.g. Cricket"
              value={values.sport}
              onChange={(e) => setField("sport", e.target.value)}
              error={fieldErrors.sport}
              disabled={submitting}
            />
            <datalist id={SPORTS_LIST_ID}>
              {COMMON_SPORTS.map((sport) => (
                <option key={sport} value={sport} />
              ))}
            </datalist>
          </div>
        </div>
      </FormSection>

      {hasLogin && (
        <FormSection
          title="Login"
          description={
            isCreate
              ? "The player signs in with this email and must choose their own password the first time."
              : "The email the player signs in with."
          }
        >
          <Input
            label="Email"
            type="email"
            autoComplete="off"
            placeholder="player@academy.test"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            error={fieldErrors.email}
            disabled={submitting}
          />
          {isCreate && (
            <div className="flex items-start gap-2">
              <Input
                label="Temporary password"
                autoComplete="off"
                className="flex-1"
                hint="At least 8 characters. You'll see it once more after saving."
                value={values.temporaryPassword}
                onChange={(e) => setField("temporaryPassword", e.target.value)}
                error={fieldErrors.temporaryPassword}
                disabled={submitting}
              />
              {/* mt-6.5 = label height + gap, so the button lines up with the input. */}
              <Button
                variant="secondary"
                className="mt-6.5 h-10"
                icon="sparkle"
                onClick={() => setField("temporaryPassword", generateTemporaryPassword())}
                disabled={submitting}
              >
                Generate
              </Button>
            </div>
          )}
        </FormSection>
      )}

      {!isCreate && (
        <FormSection title="Status" description="Inactive players keep their history but cannot sign in.">
          <Switch
            label="Active"
            description={values.isActive ? "Player can sign in and take part." : "Player is signed out and blocked."}
            checked={values.isActive}
            onChange={(checked) => setField("isActive", checked)}
            disabled={submitting}
          />
        </FormSection>
      )}

      <FormActions>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </FormActions>
    </form>
  );
}
