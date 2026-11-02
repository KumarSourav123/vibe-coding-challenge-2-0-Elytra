/**
 * Shared backend enums. Use these constants instead of string literals so
 * models, services and validators always agree.
 */

export const ROLES = Object.freeze({
  COACH: "COACH",
  PLAYER: "PLAYER",
  SCOUT: "SCOUT",
});

export const SESSION_STATUS = Object.freeze({
  OPEN: "OPEN",
  CLOSED: "CLOSED",
});

export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
});

/** Readiness thresholds (core business rule #10). */
export const READINESS_RULES = Object.freeze({
  MIN_ATTENDANCE_PERCENT: 75,
  MIN_MATCHES_PLAYED: 2,
});
