/**
 * Standardized API client for sports academy management system
 * Enforces contract-compliant response handling:
 * Success: { success: true, message: string, data: any }
 * Error:   { success: false, message: string, errors: array }
 */

export async function fetchApi(endpoint, options = {}) {
  const { timeout = 8000, ...customConfig } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    method: 'GET',
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...customConfig.headers,
    },
    signal: controller.signal,
  };

  try {
    const response = await fetch(endpoint, config);
    clearTimeout(id);

    // Parse JSON safely
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      data = {
        success: false,
        message: `Invalid server response from ${endpoint} (Status: ${response.status})`,
        errors: [parseError.message],
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: data.message || `API error with status ${response.status}`,
        errors: data.errors || [data.message || 'Request failed'],
        data: data.data || null,
      };
    }

    return {
      success: true,
      status: response.status,
      message: data.message || 'Success',
      data: data.data !== undefined ? data.data : data,
    };
  } catch (error) {
    clearTimeout(id);
    const isTimeout = error.name === 'AbortError';

    return {
      success: false,
      status: isTimeout ? 408 : 503,
      message: isTimeout
        ? 'Request timed out after 8 seconds. Database or server might be slow.'
        : `Network error connecting to ${endpoint}: ${error.message}`,
      errors: [error.message],
      isNetworkError: true,
      data: null,
    };
  }
}

