// Mock responses matching docs/API_CONTRACTS.md §2.22–2.26.
// For tests and UI development only - never import from production code.

const requirements = { minAttendancePercent: 75, minMatchesPlayed: 2 };

export const readyReadinessMock = {
  isReady: true,
  attendancePercent: 75,
  sessionsAttended: 3,
  completedSessions: 4,
  matchesPlayed: 2,
  requirements,
};

export const notReadyReadinessMock = {
  isReady: false,
  attendancePercent: 66.7,
  sessionsAttended: 2,
  completedSessions: 3,
  matchesPlayed: 1,
  requirements,
};

export const playerDashboardMock = {
  success: true,
  message: "Dashboard fetched",
  data: {
    profile: { id: "665000000000000000000101", name: "Arjun Mehta", age: 16, sport: "Cricket", isActive: true },
    readiness: readyReadinessMock,
    performance: { totalScore: 87, averageScore: 43.5, bestScore: 55 },
    attendance: [
      { sessionId: "665000000000000000000304", date: "2026-11-04", sport: "Cricket", status: "PRESENT" },
      { sessionId: "665000000000000000000303", date: "2026-11-03", sport: "Cricket", status: "ABSENT" },
    ],
    matches: [
      { matchId: "665000000000000000000402", date: "2026-11-04", sport: "Cricket", opponent: "Town XI", score: 55 },
      { matchId: "665000000000000000000401", date: "2026-11-02", sport: "Cricket", opponent: "City XI", score: 32 },
    ],
  },
};

export const coachDashboardMock = {
  success: true,
  message: "Dashboard fetched",
  data: {
    summary: { players: 2, ready: 1, notReady: 1 },
    players: [
      {
        player: { id: "665000000000000000000101", name: "Arjun Mehta", age: 16, sport: "Cricket", isActive: true },
        readiness: readyReadinessMock,
        performance: { totalScore: 87, averageScore: 43.5, bestScore: 55 },
      },
      {
        player: { id: "665000000000000000000103", name: "Chen Li", age: 15, sport: "Cricket", isActive: true },
        readiness: notReadyReadinessMock,
        performance: { totalScore: 10, averageScore: 10, bestScore: 10 },
      },
    ],
  },
};
