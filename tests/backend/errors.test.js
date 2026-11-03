import mongoose from "mongoose";
import { describe, expect, it, vi } from "vitest";
import { Player } from "@/backend/models";
import { AppError, handleRouteError } from "@/backend/utils/errors";
import { AuthConfigError } from "@/lib/authToken";
import { DatabaseConfigError } from "@/lib/mongodb";
import { validationError } from "../helpers/validation";

describe("handleRouteError", () => {
  it("maps AppError to its status and errors", async () => {
    const res = handleRouteError(new AppError("Not found", 404, [{ code: "NOT_FOUND", message: "x" }]));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      success: false,
      message: "Not found",
      errors: [{ code: "NOT_FOUND", message: "x" }],
    });
  });

  it("maps mongoose ValidationError to 400 with field errors", async () => {
    const res = handleRouteError(await validationError(new Player({})));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.message).toBe("Validation failed");
    expect(body.errors.map((e) => e.field).sort()).toEqual(["academy", "age", "name", "sport"]);
  });

  it("maps CastError to 400 INVALID_ID", async () => {
    const castError = new mongoose.Error.CastError("ObjectId", "not-an-id", "player");
    const res = handleRouteError(castError);
    expect(res.status).toBe(400);
    expect((await res.json()).errors[0]).toMatchObject({ field: "player", code: "INVALID_ID" });
  });

  it("maps duplicate key error to 409", async () => {
    const res = handleRouteError({ code: 11000, keyValue: { email: "a@b.com" } });
    expect(res.status).toBe(409);
    expect((await res.json()).errors[0]).toMatchObject({ field: "email", code: "DUPLICATE" });
  });

  it("maps a missing database configuration to 503 DB_NOT_CONFIGURED", async () => {
    const res = handleRouteError(new DatabaseConfigError("MONGODB_URI is not configured"));
    expect(res.status).toBe(503);
    expect((await res.json()).errors[0].code).toBe("DB_NOT_CONFIGURED");
  });

  it("maps a server selection failure to 503 DB_CONNECTION_FAILED without leaking details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("connect ECONNREFUSED 10.0.0.5:27017"), {
      name: "MongooseServerSelectionError",
    });
    const res = handleRouteError(error);
    const text = await res.text();
    expect(res.status).toBe(503);
    expect(JSON.parse(text).errors[0].code).toBe("DB_CONNECTION_FAILED");
    expect(text).not.toContain("10.0.0.5");
  });

  it("maps a missing AUTH_SECRET to 500 AUTH_NOT_CONFIGURED", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = handleRouteError(new AuthConfigError("AUTH_SECRET must be set"));
    expect(res.status).toBe(500);
    expect((await res.json()).errors[0].code).toBe("AUTH_NOT_CONFIGURED");
  });

  it("hides internal details in production", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    const res = handleRouteError(new Error("secret stack detail"));
    vi.unstubAllEnvs();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false, message: "Internal server error", errors: [] });
  });
});
