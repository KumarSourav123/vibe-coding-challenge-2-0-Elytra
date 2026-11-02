"use client";

import { useState } from "react";
import Alert from "@/frontend/components/ui/Alert";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import { closeSession } from "../api/sessionsApi";

/**
 * Close an OPEN session after a confirmation step. Disabled while there are
 * unsaved changes or unmarked players (the server enforces the same rule).
 */
export default function CloseSessionPanel({ session, dirty, onClosed }) {
  const [confirming, setConfirming] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState(null);

  const { unmarked } = session.summary;
  let blocker = null;
  if (dirty) blocker = "Save your attendance changes first.";
  else if (unmarked > 0) blocker = `Mark the remaining ${unmarked} player${unmarked === 1 ? "" : "s"} first.`;

  async function handleClose() {
    setClosing(true);
    setError(null);
    const result = await closeSession(session.id);
    setClosing(false);
    setConfirming(false);
    if (result.ok) {
      onClosed(result.data.session);
      return;
    }
    setError(
      result.code === "ATTENDANCE_INCOMPLETE"
        ? `${result.message}: ${result.errors.map((e) => e.message.replace(" has not been marked", "")).join(", ")}`
        : result.message
    );
  }

  return (
    <Card
      title="Close session"
      description="Locks attendance permanently. Closed sessions count toward each player's attendance %."
    >
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {confirming ? (
        <div className="space-y-4">
          <Alert tone="warning" title="This can't be undone">
            Attendance for this session will be locked. Make sure every player is marked correctly.
          </Alert>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={closing}>
              Cancel
            </Button>
            <Button icon="lock" onClick={handleClose} disabled={closing}>
              {closing ? "Closing..." : "Yes, close session"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{blocker ?? "Every eligible player is marked."}</p>
          <Button variant="secondary" icon="lock" onClick={() => setConfirming(true)} disabled={Boolean(blocker)}>
            Close session
          </Button>
        </div>
      )}
    </Card>
  );
}
