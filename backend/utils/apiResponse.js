import { NextResponse } from 'next/server.js';

/**
 * Standard successful API response helper conforming to the API contract.
 *
 * Format:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... }
 * }
 *
 * @param {object|array|null} data - Payload data
 * @param {string} message - Human-readable success message
 * @param {number} status - HTTP status code (default: 200)
 * @returns {NextResponse}
 */
export function successResponse(data = {}, message = 'Operation completed successfully', status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Standard error API response helper conforming to the API contract.
 *
 * Format:
 * {
 *   "success": false,
 *   "message": "...",
 *   "errors": [ ... ]
 * }
 *
 * @param {string} message - Primary error summary
 * @param {Array<string|object>} errors - Detailed error array
 * @param {number} status - HTTP status code (default: 500)
 * @param {object} [extra] - Optional extra metadata (e.g. data object for health status)
 * @returns {NextResponse}
 */
export function errorResponse(message = 'An error occurred', errors = [], status = 500, extra = {}) {
  const payload = {
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
    ...extra,
  };

  return NextResponse.json(payload, { status });
}
