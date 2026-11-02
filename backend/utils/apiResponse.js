import { NextResponse } from "next/server";

/**
 * Standard API response helpers. Every route handler must respond through
 * these so the shape always matches docs/API_CONTRACTS.md:
 *
 *   success: { success: true,  message, data }
 *   error:   { success: false, message, errors }
 */

export function successResponse(data = {}, message = "Operation completed successfully", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function errorResponse(message = "Something went wrong", errors = [], status = 500) {
  return NextResponse.json({ success: false, message, errors }, { status });
}
