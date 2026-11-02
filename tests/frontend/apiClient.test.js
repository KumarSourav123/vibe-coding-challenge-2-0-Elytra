import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, buildUrl, normalizeApiResponse } from "@/frontend/utils/apiClient";

describe("buildUrl", () => {
  it("adds non-empty query values only", () => {
    expect(buildUrl("/api/players", { sport: "Cricket", search: "", status: "all", x: null })).toBe(
      "/api/players?sport=Cricket&status=all"
    );
    expect(buildUrl("/api/players", {})).toBe("/api/players");
    expect(buildUrl("/api/players")).toBe("/api/players");
  });

  it("encodes values", () => {
    expect(buildUrl("/api/players", { search: "a&b c" })).toBe("/api/players?search=a%26b+c");
  });
});

describe("normalizeApiResponse", () => {
  it("passes through success data", () => {
    expect(normalizeApiResponse(201, { success: true, message: "Created", data: { id: 1 } })).toEqual({
      ok: true,
      status: 201,
      data: { id: 1 },
      message: "Created",
    });
  });

  it("collects the first error per field", () => {
    const result = normalizeApiResponse(400, {
      success: false,
      message: "Validation failed",
      errors: [
        { field: "age", code: "INVALID_FIELD", message: "first" },
        { field: "age", code: "INVALID_FIELD", message: "second" },
        { field: "name", code: "INVALID_FIELD", message: "name bad" },
      ],
    });
    expect(result).toMatchObject({ ok: false, status: 400, code: "INVALID_FIELD", fieldErrors: { age: "first", name: "name bad" } });
  });

  it("handles a missing body", () => {
    expect(normalizeApiResponse(502, null)).toMatchObject({ ok: false, code: "UNKNOWN", fieldErrors: {} });
  });
});

describe("apiRequest", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends JSON bodies with the right headers and no caching", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, json: async () => ({ success: true, data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    await apiRequest("/api/x", { method: "PATCH", body: { a: 1 } });
    expect(fetchMock).toHaveBeenCalledWith("/api/x", {
      method: "PATCH",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it("returns NETWORK_ERROR instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect(await apiRequest("/api/x")).toMatchObject({ ok: false, status: 0, code: "NETWORK_ERROR" });
  });
});
