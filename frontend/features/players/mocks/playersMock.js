// Mock responses matching docs/API_CONTRACTS.md §2.7–2.11.
// For tests and UI development only - never import from production code.

export const playerMock = {
  id: "665000000000000000000101",
  name: "Asha Rao",
  age: 16,
  sport: "Cricket",
  isActive: true,
  createdAt: "2026-11-02T10:00:00.000Z",
  updatedAt: "2026-11-02T10:00:00.000Z",
  account: { userId: "665000000000000000000201", email: "asha@academy.test", mustChangePassword: true },
};

export const playerListMock = {
  success: true,
  message: "Players fetched",
  data: {
    players: [
      playerMock,
      {
        ...playerMock,
        id: "665000000000000000000102",
        name: "Ben Thomas",
        age: 17,
        sport: "Football",
        account: { userId: "665000000000000000000202", email: "ben@academy.test", mustChangePassword: false },
      },
    ],
    count: 2,
  },
};

export const playerCreatedMock = { success: true, message: "Player created", data: { player: playerMock } };

export const playerDuplicateEmailMock = {
  success: false,
  message: "Duplicate record",
  errors: [{ field: "email", code: "DUPLICATE", message: "This email is already registered" }],
};

export const playerNotFoundMock = {
  success: false,
  message: "Player not found",
  errors: [{ code: "NOT_FOUND", message: "Player not found" }],
};
