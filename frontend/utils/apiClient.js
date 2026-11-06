/**
 * Minimal fetch wrapper for the standard API envelope (docs/API_CONTRACTS.md §1.1).
 * Never throws: every outcome becomes
 *   { ok: true,  status, data, message }
 *   { ok: false, status, code, message, errors, fieldErrors }
 */

const NETWORK_ERROR_MESSAGE = "Unable to reach the server. Please try again.";

export function normalizeApiResponse(status, body) {
  if (body?.success === true) {
    return { ok: true, status, data: body.data ?? {}, message: body.message };
  }

  const errors = Array.isArray(body?.errors) ? body.errors : [];
  const fieldErrors = {};
  for (const error of errors) {
    if (error.field && !fieldErrors[error.field]) fieldErrors[error.field] = error.message;
  }

  return {
    ok: false,
    status,
    code: errors[0]?.code ?? "UNKNOWN",
    message: body?.message ?? "Something went wrong. Please try again.",
    errors,
    fieldErrors,
  };
}

/** True when a result means "this record doesn't exist" (unknown, malformed or another academy's id). */
export function isNotFoundResult(result) {
  return result?.code === "NOT_FOUND" || result?.code === "INVALID_ID";
}

/** Build "/path?a=1" from a query object, skipping empty values. */
export function buildUrl(path, query) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: object, query?: object }} [options]
 */
export async function apiRequest(path, { method = "GET", body, query } = {}) {
  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      cache: "no-store",
      ...(body !== undefined && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
    const json = await response.json().catch(() => null);
    return normalizeApiResponse(response.status, json);
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: NETWORK_ERROR_MESSAGE,
      errors: [],
      fieldErrors: {},
    };
  }
}
