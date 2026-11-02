/**
 * Client for GET /api/health (see docs/API_CONTRACTS.md).
 * Normalises every outcome - success, 503, network failure, malformed body -
 * into one shape the UI can render.
 *
 * @typedef {object} HealthResult
 * @property {"connected" | "disconnected"} status
 * @property {string} message
 * @property {number | null} latencyMs
 * @property {string | null} errorCode
 * @property {string} checkedAt ISO timestamp of when the check completed
 */

export const HEALTH_ENDPOINT = "/api/health";

/**
 * Convert a contract response body into a HealthResult.
 * @param {object | null} body Parsed JSON body (null if it could not be parsed)
 * @returns {HealthResult}
 */
export function parseHealthResponse(body) {
  const checkedAt = new Date().toISOString();

  if (body?.success === true && body.data?.database?.status === "connected") {
    return {
      status: "connected",
      message: body.message,
      latencyMs: body.data.database.latencyMs ?? null,
      errorCode: null,
      checkedAt,
    };
  }

  return {
    status: "disconnected",
    message: body?.errors?.[0]?.message ?? body?.message ?? "Health check failed",
    latencyMs: null,
    errorCode: body?.errors?.[0]?.code ?? "UNKNOWN",
    checkedAt,
  };
}

/**
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<HealthResult>}
 */
export async function fetchHealth({ signal } = {}) {
  try {
    const response = await fetch(HEALTH_ENDPOINT, { cache: "no-store", signal });
    const body = await response.json().catch(() => null);
    return parseHealthResponse(body);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return {
      status: "disconnected",
      message: "Unable to reach the server",
      latencyMs: null,
      errorCode: "NETWORK_ERROR",
      checkedAt: new Date().toISOString(),
    };
  }
}
