import mongoose from "mongoose";
import { ATTENDANCE_STATUS } from "@/backend/utils/constants";
import { parseDateOnly } from "@/backend/utils/date";
import { normalizeSport } from "@/backend/utils/sport";
import { checkString, createValidator } from "./common";

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;
const MAX_RECORDS = 500;
const STATUSES = ["open", "closed", "all"];
const ATTENDANCE_VALUES = Object.values(ATTENDANCE_STATUS);

/** Validates "YYYY-MM-DD" within the supported range; returns a UTC-midnight Date. */
export function checkDateOnly(v, field, value) {
  if (typeof value !== "string" || !value.trim()) return v.add(field, "Date is required");
  const date = parseDateOnly(value);
  if (!date) return v.add(field, "Date must be a valid date in YYYY-MM-DD format");
  const year = date.getUTCFullYear();
  if (year < MIN_YEAR || year > MAX_YEAR) return v.add(field, `Date must be between ${MIN_YEAR} and ${MAX_YEAR}`);
  return date;
}

/** POST /api/sessions body (docs/API_CONTRACTS.md §2.12). */
export function validateCreateSessionInput(body) {
  const v = createValidator();
  const input = {
    date: checkDateOnly(v, "date", body.date),
    sport: normalizeSport(checkString(v, "sport", body.sport, { label: "Sport", min: 1, max: 50 })),
  };
  v.throwIfErrors();
  return input;
}

/** GET /api/sessions query (§2.13). */
export function validateSessionQuery(searchParams) {
  const v = createValidator();
  const status = searchParams.get("status") || "all";
  if (!STATUSES.includes(status)) v.add("status", "Status must be open, closed or all");
  const sport = normalizeSport(searchParams.get("sport") || "");
  v.throwIfErrors();
  return { status, sport: sport || null };
}

/**
 * POST /api/sessions/:id/attendance body (§2.15).
 * Shape only - eligibility is checked by the service against the database.
 * @returns {Array<{ playerId: string, status: "PRESENT"|"ABSENT" }>}
 */
export function validateAttendanceInput(body) {
  const v = createValidator();
  const { records } = body;

  if (!Array.isArray(records) || records.length === 0) {
    v.add("records", "Provide at least one attendance record");
    v.throwIfErrors();
  }
  if (records.length > MAX_RECORDS) {
    v.add("records", `At most ${MAX_RECORDS} records per request`);
    v.throwIfErrors();
  }

  const seen = new Set();
  const cleaned = records.map((record, index) => {
    const playerId = typeof record?.playerId === "string" ? record.playerId : "";
    const status = record?.status;

    if (!mongoose.isValidObjectId(playerId)) {
      v.add(`records.${index}.playerId`, "Player id is invalid");
    } else if (seen.has(playerId)) {
      v.add(`records.${index}.playerId`, "Each player can appear only once per request");
    }
    seen.add(playerId);

    if (!ATTENDANCE_VALUES.includes(status)) {
      v.add(`records.${index}.status`, "Status must be PRESENT or ABSENT");
    }
    return { playerId, status };
  });

  v.throwIfErrors();
  return cleaned;
}
