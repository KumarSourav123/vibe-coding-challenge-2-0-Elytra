/**
 * Helpers for the participant picker. `selection` is { [playerId]: scoreText }.
 */

/** Validate the selection and build the API payload. */
export function buildParticipants(selection) {
  const errors = {};
  const participants = Object.entries(selection).map(([playerId, scoreText]) => {
    const text = String(scoreText).trim();
    const score = Number(text);
    if (text === "") errors[playerId] = "Enter a score";
    else if (!Number.isFinite(score) || score < 0 || score > 100000) errors[playerId] = "Score must be 0–100000";
    return { playerId, score };
  });
  return { participants, errors };
}

/**
 * Map server errors ("participants.<i>.playerId|score") back to player ids
 * using the payload that was sent.
 */
export function participantErrorsFrom(result, participants) {
  const byPlayer = {};
  for (const error of result.errors ?? []) {
    const match = /^participants\.(\d+)\./.exec(error.field ?? "");
    const playerId = match ? participants[Number(match[1])]?.playerId : error.playerId;
    if (playerId && !byPlayer[playerId]) byPlayer[playerId] = error.message;
  }
  return byPlayer;
}

/** Selection pre-filled from an existing match. */
export function selectionFromMatch(match) {
  return Object.fromEntries(match.participants.map((p) => [p.player.id, String(p.score)]));
}
