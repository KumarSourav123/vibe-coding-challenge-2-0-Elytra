import mongoose from "mongoose";
import { errorResponse } from "./apiResponse";

const DB_CONNECTION_ERRORS = new Set([
  "MongooseServerSelectionError",
  "MongoServerSelectionError",
  "MongoNetworkError",
  "MongoNetworkTimeoutError",
]);

/**
 * Error thrown by backend services for expected failures (validation,
 * not found, forbidden, ...). Route handlers convert it with handleRouteError.
 */
export class AppError extends Error {
  /**
   * @param {string} message Safe, user-facing message.
   * @param {number} [statusCode=400]
   * @param {Array<{field?: string, code?: string, message: string}>} [errors=[]]
   */
  constructor(message, statusCode = 400, errors = []) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Convert any thrown error into the standard error response.
 * Never leaks stack traces or internal messages in production.
 */
export function handleRouteError(error) {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.errors, error.statusCode);
  }

  if (error?.code === "DB_NOT_CONFIGURED" || DB_CONNECTION_ERRORS.has(error?.name)) {
    const code = error.code === "DB_NOT_CONFIGURED" ? "DB_NOT_CONFIGURED" : "DB_CONNECTION_FAILED";
    if (code === "DB_CONNECTION_FAILED") console.error("[api] Database unavailable:", error.message);
    return errorResponse(
      "Service unavailable",
      [{ code, message: "The database is currently unavailable" }],
      503
    );
  }

  if (error?.code === "AUTH_NOT_CONFIGURED") {
    console.error("[api]", error.message);
    return errorResponse(
      "Authentication is not configured",
      [{ code: "AUTH_NOT_CONFIGURED", message: "Authentication is not configured" }],
      500
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      code: "INVALID_FIELD",
      message: err.message,
    }));
    return errorResponse("Validation failed", errors, 400);
  }

  if (error instanceof mongoose.Error.CastError) {
    return errorResponse(
      "Validation failed",
      [{ field: error.path, code: "INVALID_ID", message: `Invalid value for ${error.path}` }],
      400
    );
  }

  if (error?.code === 11000) {
    const fields = Object.keys(error.keyValue ?? {});
    return errorResponse(
      "Duplicate record",
      fields.map((field) => ({ field, code: "DUPLICATE", message: `${field} already exists` })),
      409
    );
  }

  console.error("[api] Unhandled error:", error);
  const errors =
    process.env.NODE_ENV === "production"
      ? []
      : [{ code: "INTERNAL_ERROR", message: error?.message ?? String(error) }];
  return errorResponse("Internal server error", errors, 500);
}
