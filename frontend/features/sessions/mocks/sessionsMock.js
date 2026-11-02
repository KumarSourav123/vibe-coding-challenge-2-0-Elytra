// Mock responses matching docs/API_CONTRACTS.md §2.12–2.16.
// For tests and UI development only - never import from production code.

const player = (id, name) => ({ id, name, age: 16, isActive: true });

// List entries have no roster.
export const openSessionSummaryMock = {
  id: "665000000000000000000301",
  date: "2026-11-02",
  sport: "Cricket",
  status: "OPEN",
  closedAt: null,
  createdAt: "2026-11-02T08:00:00.000Z",
  updatedAt: "2026-11-02T08:30:00.000Z",
  summary: { eligible: 3, marked: 2, present: 1, absent: 1, unmarked: 1 },
};

export const openSessionMock = {
  ...openSessionSummaryMock,
  roster: [
    { player: player("665000000000000000000101", "Arjun Mehta"), status: "PRESENT", markedAt: "2026-11-02T08:30:00.000Z", eligible: true },
    { player: player("665000000000000000000102", "Bela Singh"), status: "ABSENT", markedAt: "2026-11-02T08:30:00.000Z", eligible: true },
    { player: player("665000000000000000000103", "Chen Li"), status: null, markedAt: null, eligible: true },
  ],
};

export const sessionListMock = {
  success: true,
  message: "Sessions fetched",
  data: {
    sessions: [
      openSessionSummaryMock,
      {
        id: "665000000000000000000302",
        date: "2026-11-01",
        sport: "Cricket",
        status: "CLOSED",
        closedAt: "2026-11-01T10:00:00.000Z",
        createdAt: "2026-11-01T08:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
        summary: { eligible: 3, marked: 3, present: 3, absent: 0, unmarked: 0 },
      },
    ],
    count: 2,
  },
};

export const sessionClosedErrorMock = {
  success: false,
  message: "This session is closed and can no longer be changed",
  errors: [{ code: "SESSION_CLOSED", message: "This session is closed and can no longer be changed" }],
};

export const attendanceIncompleteMock = {
  success: false,
  message: "Mark every eligible player before closing (1 unmarked)",
  errors: [
    {
      field: "playerId",
      code: "ATTENDANCE_INCOMPLETE",
      playerId: "665000000000000000000103",
      message: "Chen Li has not been marked",
    },
  ],
};
