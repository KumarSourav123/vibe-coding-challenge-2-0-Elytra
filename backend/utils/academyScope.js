import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AppError } from "./errors";

/**
 * Shared helpers for academy-scoped records (players, sessions, matches).
 * A record from another academy is reported exactly like an unknown id, so
 * one academy can never learn anything about another.
 */

/** 404 NOT_FOUND, e.g. notFoundError("Player") -> "Player not found". */
export function notFoundError(entity) {
  const message = `${entity} not found`;
  return new AppError(message, 404, [{ code: "NOT_FOUND", message }]);
}

/** 409 CONFLICT for a record changed by a concurrent request. */
export function conflictError(entity) {
  const message = `The ${entity.toLowerCase()} was changed by another request. Reload and try again`;
  return new AppError(message, 409, [{ code: "CONFLICT", message }]);
}

/** @throws {AppError} 400 INVALID_ID when `id` isn't a valid ObjectId. */
export function assertValidId(id, entity) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Validation failed", 400, [
      { field: "id", code: "INVALID_ID", message: `Invalid ${entity.toLowerCase()} id` },
    ]);
  }
}

/**
 * Load one record of `Model` by id **within the academy**.
 * @throws {AppError} 400 INVALID_ID or 404 NOT_FOUND
 */
export async function findInAcademyOrThrow(Model, id, academyId, entity) {
  assertValidId(id, entity);
  await connectToDatabase();
  const doc = await Model.findOne({ _id: id, academy: academyId });
  if (!doc) throw notFoundError(entity);
  return doc;
}
