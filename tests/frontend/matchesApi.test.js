import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMatch,
  getEligiblePlayers,
  getMatch,
  listMatches,
  updateMatch,
} from "@/frontend/features/matches/api/matchesApi";
import { eligiblePlayersMock, matchMock, matchNotEligibleMock } from "@/frontend/features/matches/mocks/matchesMock";
import {
  buildParticipants,
  participantErrorsFrom,
  selectionFromMatch,
} from "@/frontend/features/matches/utils/participants";
import { normalizeApiResponse } from "@/frontend/utils/apiClient";

const respond = (body, status = 200) => vi.fn().mockResolvedValue({ status, json: async () => body });

describe("matches API client", () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = respond(eligiblePlayersMock);
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());
  const lastCall = () => fetchMock.mock.calls.at(-1);

  it("builds every endpoint per the contract", async () => {
    const eligible = await getEligiblePlayers({ date: "2026-11-02", sport: "Cricket" });
    expect(lastCall()[0]).toBe("/api/matches/eligible-players?date=2026-11-02&sport=Cricket");
    expect(eligible.data.players).toHaveLength(2);

    await listMatches({ sport: "" });
    expect(lastCall()[0]).toBe("/api/matches");

    await getMatch("m1");
    expect(lastCall()[0]).toBe("/api/matches/m1");

    await createMatch({ date: "2026-11-02", sport: "Cricket", opponent: "X", participants: [] });
    expect(lastCall()).toEqual(["/api/matches", expect.objectContaining({ method: "POST" })]);

    await updateMatch("m1", { opponent: "Y" });
    expect(lastCall()).toEqual(["/api/matches/m1", expect.objectContaining({ method: "PATCH", body: '{"opponent":"Y"}' })]);
  });
});

describe("participant helpers", () => {
  it("builds the payload and flags missing or invalid scores", () => {
    expect(buildParticipants({ a: "55", b: "7.5" })).toEqual({
      participants: [
        { playerId: "a", score: 55 },
        { playerId: "b", score: 7.5 },
      ],
      errors: {},
    });
    expect(buildParticipants({ a: "", b: "-1", c: "x" }).errors).toEqual({
      a: "Enter a score",
      b: "Score must be 0–100000",
      c: "Score must be 0–100000",
    });
  });

  it("maps server errors back to player ids by index", () => {
    const sent = [{ playerId: "a" }, { playerId: "b" }, { playerId: "665000000000000000000103" }];
    const result = normalizeApiResponse(400, matchNotEligibleMock);
    expect(participantErrorsFrom(result, sent)).toEqual({
      "665000000000000000000103": "Chen Li was absent on 2026-11-02",
    });
  });

  it("pre-fills a selection from an existing match", () => {
    expect(selectionFromMatch(matchMock)).toEqual({
      "665000000000000000000101": "55",
      "665000000000000000000102": "32",
    });
  });
});
