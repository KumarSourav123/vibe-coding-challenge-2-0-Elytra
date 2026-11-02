// Mock responses matching docs/API_CONTRACTS.md §2.2–2.4.
// For tests and UI development only - never import from production code.

export const coachUserMock = {
  id: "665000000000000000000001",
  name: "Coach Demo",
  email: "coach@academy.test",
  role: "COACH",
  playerId: null,
};

export const loginSuccessMock = {
  success: true,
  message: "Login successful",
  data: { user: coachUserMock, homePath: "/coach" },
};

export const loginInvalidCredentialsMock = {
  success: false,
  message: "Invalid email or password",
  errors: [{ code: "INVALID_CREDENTIALS", message: "Invalid email or password" }],
};

export const loginValidationMock = {
  success: false,
  message: "Validation failed",
  errors: [
    { field: "email", code: "INVALID_FIELD", message: "Email is invalid" },
    { field: "password", code: "INVALID_FIELD", message: "Password is required" },
  ],
};

export const meSuccessMock = {
  success: true,
  message: "Authenticated",
  data: { user: coachUserMock, homePath: "/coach" },
};

export const meUnauthenticatedMock = {
  success: false,
  message: "Authentication required",
  errors: [{ code: "UNAUTHENTICATED", message: "Please log in to continue" }],
};
