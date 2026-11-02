import { connectToDatabase, getConnectionState, pingDatabase } from "@/lib/mongodb";

/**
 * Check application and database health.
 * Never throws: always resolves with a status object the route can return.
 */
export async function getHealthStatus() {
  const timestamp = new Date().toISOString();

  try {
    await connectToDatabase();
    const latencyMs = await pingDatabase();
    return {
      healthy: true,
      app: { status: "ok", timestamp },
      database: { status: "connected", latencyMs },
    };
  } catch (error) {
    const isConfigError = error?.code === "DB_NOT_CONFIGURED";
    if (!isConfigError) {
      console.error("[health] Database check failed:", error?.message ?? error);
    }
    return {
      healthy: false,
      app: { status: "ok", timestamp },
      database: {
        status: getConnectionState() === "connecting" ? "connecting" : "disconnected",
        code: isConfigError ? "DB_NOT_CONFIGURED" : "DB_CONNECTION_FAILED",
        message: isConfigError
          ? "Database is not configured"
          : "Unable to connect to the database",
      },
    };
  }
}
