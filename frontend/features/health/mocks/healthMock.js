// Mock responses matching GET /api/health in docs/API_CONTRACTS.md.
// For tests and UI development only - never import from production code.

export const healthConnectedMock = {
  success: true,
  message: "Service is healthy",
  data: {
    app: { status: "ok", timestamp: "2026-11-02T10:00:00.000Z" },
    database: { status: "connected", latencyMs: 12 },
  },
};

export const healthNotConfiguredMock = {
  success: false,
  message: "Service unavailable: database is not connected",
  errors: [{ code: "DB_NOT_CONFIGURED", message: "Database is not configured" }],
};

export const healthConnectionFailedMock = {
  success: false,
  message: "Service unavailable: database is not connected",
  errors: [{ code: "DB_CONNECTION_FAILED", message: "Unable to connect to the database" }],
};
