// Mock responses matching docs/API_CONTRACTS.md §2.17–2.21.
// For tests and UI development only - never import from production code.

export const eligiblePlayersMock = {
  success: true,
  message: "Eligible players fetched",
  data: {
    date: "2026-11-02",
    sport: "Cricket",
    sessions: { closed: 1, open: 0 },
    players: [
      { id: "665000000000000000000101", name: "Arjun Mehta", age: 16 },
      { id: "665000000000000000000102", name: "Bela Singh", age: 17 },
    ],
  },
};

export const matchMock = {
  id: "665000000000000000000401",
  date: "2026-11-02",
  sport: "Cricket",
  opponent: "City XI",
  createdAt: "2026-11-02T15:00:00.000Z",
  updatedAt: "2026-11-02T15:00:00.000Z",
  summary: { participants: 2, totalScore: 87, topScore: 55, topScorer: { id: "665000000000000000000101", name: "Arjun Mehta" } },
  participants: [
    { player: { id: "665000000000000000000101", name: "Arjun Mehta", age: 16, isActive: true }, score: 55 },
    { player: { id: "665000000000000000000102", name: "Bela Singh", age: 17, isActive: true }, score: 32 },
  ],
};

export const matchNotEligibleMock = {
  success: false,
  message: "Some players are not eligible for this match",
  errors: [
    {
      field: "participants.2.playerId",
      code: "NOT_ELIGIBLE",
      playerId: "665000000000000000000103",
      message: "Chen Li was absent on 2026-11-02",
    },
  ],
};
