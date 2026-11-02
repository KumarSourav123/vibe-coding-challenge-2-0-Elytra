import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  closeSession,
  createSession,
  getSession,
  listSessions,
  markAttendance,
} from "@/frontend/features/sessions/api/sessionsApi";
import { attendanceLabel } from "@/frontend/features/sessions/utils/attendanceLabel";
import {
  attendanceIncompleteMock,
  openSessionMock,
  sessionListMock,
} from "@/frontend/features/sessions/mocks/sessionsMock";
import { formatDayLabel, todayDateOnly } from "@/frontend/utils/date";
import { normalizeSport } from "@/frontend/utils/sport";

const respond = (body, status = 200) => vi.fn().mockResolvedValue({ status, json: async () => body });

describe("sessions API client", () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = respond(sessionListMock);
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());
  const lastCall = () => fetchMock.mock.calls.at(-1);

  it("builds every endpoint per the contract", async () => {
    await listSessions({ status: "open", sport: "" });
    expect(lastCall()[0]).toBe("/api/sessions?status=open");

    await getSession("abc");
    expect(lastCall()[0]).toBe("/api/sessions/abc");

    await createSession({ date: "2026-11-02", sport: "Cricket" });
    expect(lastCall()).toEqual(["/api/sessions", expect.objectContaining({ method: "POST" })]);

    await markAttendance("abc", [{ playerId: "p1", status: "PRESENT" }]);
    expect(lastCall()).toEqual([
      "/api/sessions/abc/attendance",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ records: [{ playerId: "p1", status: "PRESENT" }] }) }),
    ]);

    await closeSession("abc");
    expect(lastCall()).toEqual(["/api/sessions/abc/close", expect.objectContaining({ method: "POST" })]);
  });

  it("exposes ATTENDANCE_INCOMPLETE errors with player ids", async () => {
    vi.stubGlobal("fetch", respond(attendanceIncompleteMock, 409));
    const result = await closeSession("abc");
    expect(result).toMatchObject({ ok: false, status: 409, code: "ATTENDANCE_INCOMPLETE" });
    expect(result.errors[0].playerId).toBe("665000000000000000000103");
  });
});

describe("session display helpers", () => {
  it("labels attendance for open and closed sessions", () => {
    expect(attendanceLabel(openSessionMock)).toBe("2 of 3 marked");
    expect(attendanceLabel(sessionListMock.data.sessions[1])).toBe("3 present · 0 absent");
    expect(attendanceLabel({ status: "OPEN", summary: { eligible: 0, unmarked: 0 } })).toBe("No eligible players");
  });

  it("formats calendar days without timezone drift", () => {
    expect(formatDayLabel("2026-11-02")).toBe("Mon, 2 Nov 2026");
  });

  it("gives today's local date as YYYY-MM-DD", () => {
    expect(todayDateOnly(new Date(2026, 10, 2, 23, 30))).toBe("2026-11-02");
  });

  it("normalises sport names like the server", () => {
    expect(normalizeSport(" table  TENNIS ")).toBe("Table Tennis");
  });
});
