import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";
import { disconnectFromDatabase } from "@/lib/mongodb";

describe("GET /api/health without a reachable database", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  it("returns 503 DB_NOT_CONFIGURED when MONGODB_URI is missing", async () => {
    vi.stubEnv("MONGODB_URI", "");
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      success: false,
      message: "Service unavailable: database is not connected",
      errors: [{ code: "DB_NOT_CONFIGURED", message: "Database is not configured" }],
    });
  });

  it("treats the .env.example placeholder as not configured", async () => {
    vi.stubEnv("MONGODB_URI", "your_mongodb_connection_string");
    const body = await (await GET()).json();
    expect(body.errors[0].code).toBe("DB_NOT_CONFIGURED");
  });

  it("returns 503 DB_CONNECTION_FAILED when the server is unreachable, without leaking the URI", async () => {
    const uri = "mongodb://127.0.0.1:1/unreachable";
    vi.stubEnv("MONGODB_URI", uri);
    const res = await GET();
    const text = await res.text();
    expect(res.status).toBe(503);
    expect(JSON.parse(text).errors[0].code).toBe("DB_CONNECTION_FAILED");
    expect(text).not.toContain("127.0.0.1");
  });
});
