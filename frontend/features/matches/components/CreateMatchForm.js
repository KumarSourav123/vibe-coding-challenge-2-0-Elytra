"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import FormSection, { FormActions } from "@/frontend/components/ui/FormSection";
import Input from "@/frontend/components/ui/Input";
import { COMMON_SPORTS } from "@/frontend/features/players/data/sports";
import { todayDateOnly } from "@/frontend/utils/date";
import { createMatch } from "../api/matchesApi";
import { buildParticipants, participantErrorsFrom } from "../utils/participants";
import ParticipantPicker from "./ParticipantPicker";

const SPORTS_LIST_ID = "match-sport-options";

/** New match: details, then eligible players with a score each. */
export default function CreateMatchForm() {
  const router = useRouter();
  const [values, setValues] = useState(() => ({ date: todayDateOnly(), sport: "", opponent: "" }));
  const [selection, setSelection] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [playerErrors, setPlayerErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    // Eligibility depends on date and sport, so a change starts the selection over.
    if (name === "date" || name === "sport") {
      setSelection({});
      setPlayerErrors({});
    }
  }

  function changeSelection(next) {
    setSelection(next);
    setPlayerErrors({});
    setFormError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const missing = {};
    if (!values.date) missing.date = "Date is required";
    if (!values.sport.trim()) missing.sport = "Sport is required";
    if (!values.opponent.trim()) missing.opponent = "Opponent is required";
    const { participants, errors } = buildParticipants(selection);
    setFieldErrors(missing);
    setPlayerErrors(errors);
    if (Object.keys(missing).length || Object.keys(errors).length) return;
    if (participants.length === 0) {
      setFormError("Select at least one player.");
      return;
    }

    setSubmitting(true);
    const result = await createMatch({
      date: values.date,
      sport: values.sport.trim(),
      opponent: values.opponent.trim(),
      participants,
    });
    if (result.ok) {
      router.push(`/coach/matches/${result.data.match.id}`);
      return;
    }

    setSubmitting(false);
    const byPlayer = participantErrorsFrom(result, participants);
    setPlayerErrors(byPlayer);
    const generalFieldErrors = Object.fromEntries(
      Object.entries(result.fieldErrors).filter(([field]) => !field.startsWith("participants."))
    );
    setFieldErrors(generalFieldErrors);
    // Banner for player problems or anything without a field; field errors show inline.
    if (Object.keys(byPlayer).length || !Object.keys(generalFieldErrors).length) setFormError(result.message);
  }

  return (
    <Card padding={false}>
      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="px-5 pt-5 sm:px-6">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}

        <FormSection title="Match details" description="Date and sport decide which players can be selected.">
          <div className="grid gap-4 sm:grid-cols-2">
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
                disabled={submitting}
              />
              <datalist id={SPORTS_LIST_ID}>
                {COMMON_SPORTS.map((sport) => (
                  <option key={sport} value={sport} />
                ))}
              </datalist>
            </div>
          </div>
          <Input
            label="Opponent"
            placeholder="e.g. City XI"
            value={values.opponent}
            onChange={(e) => setField("opponent", e.target.value)}
            error={fieldErrors.opponent}
            disabled={submitting}
          />
        </FormSection>

        <FormSection
          title="Players & scores"
          description="Only players marked present in a closed session on this date can play. Each selected player needs a score."
        >
          <ParticipantPicker
            date={values.date}
            sport={values.sport}
            selection={selection}
            onChange={changeSelection}
            errors={playerErrors}
            disabled={submitting}
          />
        </FormSection>

        <FormActions>
          <Button variant="secondary" onClick={() => router.push("/coach/matches")} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || Object.keys(selection).length === 0}>
            {submitting ? "Saving..." : "Create match"}
          </Button>
        </FormActions>
      </form>
    </Card>
  );
}
