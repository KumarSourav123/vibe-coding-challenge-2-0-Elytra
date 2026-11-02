"use client";

import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import Input from "@/frontend/components/ui/Input";
import { resetPlayerPassword } from "../api/playersApi";
import { generateTemporaryPassword } from "../utils/generatePassword";
import CredentialsCard from "./CredentialsCard";

/** Coach sets a new temporary password; the player is signed out everywhere. */
export default function ResetPasswordPanel({ player, onReset }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Temporary password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await resetPlayerPassword(player.id, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.fieldErrors.temporaryPassword ?? result.message);
      return;
    }
    setIssued(password);
    setOpen(false);
    setPassword("");
    onReset(result.data.player);
  }

  return (
    <Card
      title="Reset password"
      description="Signs the player out everywhere. They choose a new password at next sign-in."
      action={
        !open && (
          <Button
            variant="secondary"
            size="sm"
            icon="key"
            onClick={() => {
              setIssued(null);
              setOpen(true);
            }}
          >
            Reset
          </Button>
        )
      }
    >
      {issued && !open && (
        <CredentialsCard
          name={player.name}
          email={player.account.email}
          password={issued}
          title="New temporary password set"
        />
      )}

      {open && (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex items-end gap-2">
            <Input
              label="New temporary password"
              autoComplete="off"
              className="flex-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            <Button
              variant="secondary"
              className="h-10"
              icon="sparkle"
              onClick={() => setPassword(generateTemporaryPassword())}
              disabled={submitting}
            >
              Generate
            </Button>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Resetting..." : "Set password"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
