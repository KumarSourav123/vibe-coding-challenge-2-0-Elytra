import { AppError } from "./errors";

/** Parse a JSON object body, or throw a 400 INVALID_JSON AppError. */
export async function readJsonBody(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Request body must be a JSON object", 400, [
      { code: "INVALID_JSON", message: "Request body must be a JSON object" },
    ]);
  }
  return body;
}
