import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHealth, HEALTH_ENDPOINT, parseHealthResponse } from "@/frontend/features/health/api/healthApi";
import {
  healthConnectedMock,
  healthConnectionFailedMock,
  healthNotConfiguredMock,
} from "@/frontend/features/health/mocks/healthMock";

describe("parseHealthResponse", () => {
  it("maps a healthy response to connected", () => {
    expect(parseHealthResponse(healthConnectedMock)).toMatchObject({
      status: "connected",
      latencyMs: 12,
      errorCode: null,
    });
  });

  it("maps 503 bodies to disconnected with the error code", () => {
    expect(parseHealthResponse(healthNotConfiguredMock)).toMatchObject({
      status: "disconnected",
      errorCode: "DB_NOT_CONFIGURED",
      message: "Database is not configured",
    });
    expect(parseHealthResponse(healthConnectionFailedMock).errorCode).toBe("DB_CONNECTION_FAILED");
  });

  it("treats an unparseable body as disconnected", () => {
    expect(parseHealthResponse(null)).toMatchObject({ status: "disconnected", errorCode: "UNKNOWN" });
  });
});

describe("fetchHealth", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls the health endpoint without caching", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => healthConnectedMock });
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchHealth();
    expect(fetchMock).toHaveBeenCalledWith(HEALTH_ENDPOINT, expect.objectContaining({ cache: "no-store" }));
    expect(result.status).toBe("connected");
  });

  it("reports NETWORK_ERROR when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect(await fetchHealth()).toMatchObject({ status: "disconnected", errorCode: "NETWORK_ERROR" });
  });
});
