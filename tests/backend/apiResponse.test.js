import { describe, expect, it } from "vitest";
import { errorResponse, successResponse } from "@/backend/utils/apiResponse";

describe("apiResponse", () => {
  it("builds the standard success shape", async () => {
    const res = successResponse({ id: 1 }, "Created", 201);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true, message: "Created", data: { id: 1 } });
  });

  it("uses default success message and status", async () => {
    const res = successResponse();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      message: "Operation completed successfully",
      data: {},
    });
  });

  it("builds the standard error shape", async () => {
    const res = errorResponse("Validation failed", [{ field: "age", message: "bad" }], 400);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      message: "Validation failed",
      errors: [{ field: "age", message: "bad" }],
    });
  });
});
