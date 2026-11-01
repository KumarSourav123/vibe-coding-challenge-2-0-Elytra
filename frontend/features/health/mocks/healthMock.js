/**
 * Mock data for Health API testing in accordance with API_CONTRACTS.md
 * Enables independent frontend verification when backend is not running or offline.
 */

export const mockConnectedHealthResponse = {
  success: true,
  message: "System is healthy and database is connected",
  data: {
    status: "healthy",
    database: "connected",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    latencyMs: 42,
    services: {
      mongodb: "connected",
      apiRoute: "active",
      engine: "Next.js App Router"
    }
  }
};

export const mockDisconnectedHealthResponse = {
  success: false,
  message: "Database connection failed or MONGODB_URI not configured",
  data: {
    status: "unhealthy",
    database: "disconnected",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    latencyMs: null,
    services: {
      mongodb: "disconnected",
      apiRoute: "active",
      engine: "Next.js App Router"
    }
  },
  errors: [
    "Unable to establish connection to MongoDB Atlas. Please ensure MONGODB_URI is provided in .env.local and IP is whitelisted."
  ]
};

