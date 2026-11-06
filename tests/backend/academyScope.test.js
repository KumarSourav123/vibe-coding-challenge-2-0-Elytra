import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { assertValidId, conflictError, notFoundError } from "@/backend/utils/academyScope";
import { AppError } from "@/backend/utils/errors";

describe("academyScope helpers", () => {
  it("builds the standard 404 for any entity", () => {
    const error = notFoundError("Session");
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Session not found");
    expect(error.errors).toEqual([{ code: "NOT_FOUND", message: "Session not found" }]);
  });

  it("builds the standard 409 CONFLICT", () => {
    const error = conflictError("Match");
    expect(error.statusCode).toBe(409);
    expect(error.errors[0]).toEqual({
      code: "CONFLICT",
      message: "The match was changed by another request. Reload and try again",
    });
  });

  it("rejects malformed ids with 400 INVALID_ID and accepts real ones", () => {
    expect(() => assertValidId(String(new mongoose.Types.ObjectId()), "Player")).not.toThrow();
    for (const bad of ["123", "not-an-id", "", null, { $ne: null }]) {
      let caught;
      try {
        assertValidId(bad, "Player");
      } catch (error) {
        caught = error;
      }
      expect(caught?.statusCode).toBe(400);
      expect(caught?.errors[0]).toEqual({ field: "id", code: "INVALID_ID", message: "Invalid player id" });
    }
  });
});
