"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import FormSection, { FormActions } from "@/frontend/components/ui/FormSection";
import Input from "@/frontend/components/ui/Input";
import { listPlayers } from "@/frontend/features/players/api/playersApi";
import { COMMON_SPORTS } from "@/frontend/features/players/data/sports";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { todayDateOnly } from "@/frontend/utils/date";
import { normalizeSport } from "@/frontend/utils/sport";
import { createSession } from "../api/sessionsApi";

const SPORTS_LIST_ID = "session-sport-options";

/** New practice session: date + sport, with a live count of eligible players. */
export default function CreateSessionForm() {
  const router = useRouter();
  const [values, setValues] = useState(() => ({ date: todayDateOnly(), sport: "" }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Active players, to suggest sports in use and preview who will be on the roster.
  const { result: playersResult } = useApiQuery("session-form-players", () => listPlayers({ status: "active" }));
  const activePlayers = playersResult?.ok ? playersResult.data.players : null;
  const sportsInUse = activePlayers ? [...new Set(activePlayers.map((p) => p.sport))] : [];
  const normalized = normalizeSport(values.sport);
  const eligibleCount = activePlayers && normalized ? activePlayers.filter((p) => p.sport === normalized).length : null;

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const missing = {};
    if (!values.date) missing.date = "Date is required";
    if (!values.sport.trim()) missing.sport = "Sport is required";
    if (Object.keys(missing).length) {
      setFieldErrors(missing);
      return;
    }

    setSubmitting(true);
    const result = await createSession({ date: values.date, sport: values.sport.trim() });
    if (result.ok) {
      router.push(`/coach/sessions/${result.data.session.id}`);
      return;
    }
    setSubmitting(false);
    setFieldErrors(result.fieldErrors);
    if (Object.keys(result.fieldErrors).length === 0) setFormError(result.message);
  }

  let sportHint = "Players whose sport matches (and who are active) will be on the roster.";
  if (eligibleCount !== null) {
    sportHint =
      eligibleCount === 0
        ? `No active players play ${normalized} yet.`
        : `${eligibleCount} active player${eligibleCount === 1 ? "" : "s"} play${eligibleCount === 1 ? "s" : ""} ${normalized}.`;
  }

  return (
    <Card padding={false}>
      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="px-5 pt-5 sm:px-6">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <FormSection
          title="Session details"
          description="Attendance is marked per player once the session is created. Closed sessions count toward attendance %."
        >
          <Input
            label="Date"
            type="date"
            value={values.date}
            onChange={(e) => setField("date", e.target.value)}
            error={fieldErrors.date}
            disabled={submitting}
            suppressHydrationWarning
          />
          <div>
            <Input
              label="Sport"
              list={SPORTS_LIST_ID}
              placeholder="e.g. Cricket"
              value={values.sport}
              onChange={(e) => setField("sport", e.target.value)}
              error={fieldErrors.sport}
              hint={sportHint}
              disabled={submitting}
            />
            <datalist id={SPORTS_LIST_ID}>
              {[...new Set([...sportsInUse, ...COMMON_SPORTS])].map((sport) => (
                <option key={sport} value={sport} />
              ))}
            </datalist>
          </div>
        </FormSection>
        <FormActions>
          <Button variant="secondary" onClick={() => router.push("/coach/sessions")} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create session"}
          </Button>
        </FormActions>
      </form>
    </Card>
  );
}
