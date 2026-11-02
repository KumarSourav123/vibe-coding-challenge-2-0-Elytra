import { normalizeSport } from "@/backend/utils/sport";
import {
  checkBoolean,
  checkEmail,
  checkInteger,
  checkNewPassword,
  checkString,
  createValidator,
} from "./common";

const NAME = { label: "Name", min: 2, max: 100 };
const AGE = { label: "Age", min: 5, max: 60 };
const SPORT = { label: "Sport", min: 1, max: 50 };
const STATUSES = ["active", "inactive", "all"];
const SEARCH_MAX_LENGTH = 100;
const UPDATABLE_FIELDS = ["name", "age", "sport", "email", "isActive"];

/** POST /api/players body (docs/API_CONTRACTS.md §2.7). */
export function validateCreatePlayerInput(body) {
  const v = createValidator();
  const input = {
    name: checkString(v, "name", body.name, NAME),
    age: checkInteger(v, "age", body.age, AGE),
    sport: normalizeSport(checkString(v, "sport", body.sport, SPORT)),
    email: checkEmail(v, "email", body.email),
    temporaryPassword: checkNewPassword(v, "temporaryPassword", body.temporaryPassword, "Temporary password"),
  };
  v.throwIfErrors();
  return input;
}

/** PATCH /api/players/:id body (§2.10). Only provided fields are validated and returned. */
export function validateUpdatePlayerInput(body) {
  const v = createValidator();
  const provided = UPDATABLE_FIELDS.filter((field) => body[field] !== undefined);
  if (provided.length === 0) {
    v.add("body", `Provide at least one of: ${UPDATABLE_FIELDS.join(", ")}`);
    v.throwIfErrors();
  }

  const updates = {};
  if (body.name !== undefined) updates.name = checkString(v, "name", body.name, NAME);
  if (body.age !== undefined) updates.age = checkInteger(v, "age", body.age, AGE);
  if (body.sport !== undefined) updates.sport = normalizeSport(checkString(v, "sport", body.sport, SPORT));
  if (body.email !== undefined) updates.email = checkEmail(v, "email", body.email);
  if (body.isActive !== undefined) updates.isActive = checkBoolean(v, "isActive", body.isActive, "isActive");

  v.throwIfErrors();
  return updates;
}

/** POST /api/players/:id/reset-password body (§2.11). */
export function validateResetPasswordInput(body) {
  const v = createValidator();
  const temporaryPassword = checkNewPassword(
    v,
    "temporaryPassword",
    body.temporaryPassword,
    "Temporary password"
  );
  v.throwIfErrors();
  return { temporaryPassword };
}

/** GET /api/players query (§2.8). */
export function validatePlayerQuery(searchParams) {
  const v = createValidator();

  const status = searchParams.get("status") || "all";
  if (!STATUSES.includes(status)) v.add("status", "Status must be active, inactive or all");

  const search = (searchParams.get("search") || "").trim();
  if (search.length > SEARCH_MAX_LENGTH) v.add("search", `Search must be at most ${SEARCH_MAX_LENGTH} characters`);

  const sport = normalizeSport(searchParams.get("sport") || "");

  v.throwIfErrors();
  return { status, search, sport: sport || null };
}
