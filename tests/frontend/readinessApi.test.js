import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCoachDashboard,
  getPlayerDashboard,
  getPlayerPerformance,
  getReadyPlayer,
  listReadyPlayers,
} from "@/frontend/features/readiness/api/readinessApi";
import {
  notReadyReadinessMock,
  playerDashboardMock,
  readyReadinessMock,
} from "@/frontend/features/readiness/mocks/readinessMock";
import { formatScore, readinessGaps, readinessSummary } from "@/frontend/features/readiness/utils/readinessText";

describe("readiness API client", () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ status: 200, json: async () => playerDashboardMock });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());
  const lastUrl = () => fetchMock.mock.calls.at(-1)[0];

  it("calls the contract endpoints", async () => {
    await getCoachDashboard({ readiness: "ready", sport: "" });
    expect(lastUrl()).toBe("/api/coach/dashboard?readiness=ready");
    await getPlayerPerformance("p1");
    expect(lastUrl()).toBe("/api/players/p1/performance");
    const dashboard = await getPlayerDashboard();
    expect(lastUrl()).toBe("/api/player/dashboard"); // never sends a player id
    expect(dashboard.data.profile.name).toBe("Arjun Mehta");
    await listReadyPlayers({ sport: "Cricket" });
    expect(lastUrl()).toBe("/api/scout/players?sport=Cricket");
    await getReadyPlayer("p2");
    expect(lastUrl()).toBe("/api/scout/players/p2");
  });
});

describe("readiness text", () => {
  it("has no gaps when Ready", () => {
    expect(readinessGaps(readyReadinessMock)).toEqual([]);
    expect(readinessSummary(readyReadinessMock)).toBe("Meets both requirements");
  });

  it("explains every missing requirement", () => {
    expect(readinessGaps(notReadyReadinessMock)).toEqual(["Attendance 66.7% (needs 75%)", "1 more match needed"]);
    expect(readinessGaps({ ...notReadyReadinessMock, completedSessions: 0, sessionsAttended: 0, matchesPlayed: 0 })).toEqual([
      "No completed practice sessions yet",
      "2 more matches needed",
    ]);
  });

  it("uses the exact rule, not the rounded percentage", () => {
    const edge = { ...readyReadinessMock, isReady: false, attendancePercent: 75, sessionsAttended: 2999, completedSessions: 3999 };
    expect(readinessGaps(edge)).toEqual(["Attendance 75% (needs 75%)"]);
  });

  it("formats scores", () => {
    expect(formatScore(null)).toBe("—");
    expect(formatScore(55)).toBe("55");
    expect(formatScore(43.25)).toBe("43.3");
  });
});
