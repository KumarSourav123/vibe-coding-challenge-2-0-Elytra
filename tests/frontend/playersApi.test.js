import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPlayer,
  getPlayer,
  listPlayers,
  resetPlayerPassword,
  updatePlayer,
} from "@/frontend/features/players/api/playersApi";
import {
  playerCreatedMock,
  playerDuplicateEmailMock,
  playerListMock,
  playerMock,
  playerNotFoundMock,
} from "@/frontend/features/players/mocks/playersMock";
import { generateTemporaryPassword } from "@/frontend/features/players/utils/generatePassword";

const respond = (body, status = 200) => vi.fn().mockResolvedValue({ status, json: async () => body });

describe("players API client", () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = respond(playerListMock);
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const lastCall = () => fetchMock.mock.calls.at(-1);

  it("lists players with filters in the query string", async () => {
    const result = await listPlayers({ sport: "Cricket", status: "active", search: "" });
    expect(lastCall()[0]).toBe("/api/players?sport=Cricket&status=active");
    expect(result.data.players).toHaveLength(2);
  });

  it("gets, updates and resets by id", async () => {
    await getPlayer(playerMock.id);
    expect(lastCall()[0]).toBe(`/api/players/${playerMock.id}`);

    await updatePlayer(playerMock.id, { age: 17 });
    expect(lastCall()).toEqual([
      `/api/players/${playerMock.id}`,
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ age: 17 }) }),
    ]);

    await resetPlayerPassword(playerMock.id, "Reset@5678");
    expect(lastCall()).toEqual([
      `/api/players/${playerMock.id}/reset-password`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ temporaryPassword: "Reset@5678" }) }),
    ]);
  });

  it("creates a player and exposes field errors on conflict", async () => {
    vi.stubGlobal("fetch", respond(playerCreatedMock, 201));
    expect((await createPlayer({ name: "Asha" })).data.player.id).toBe(playerMock.id);

    vi.stubGlobal("fetch", respond(playerDuplicateEmailMock, 409));
    expect(await createPlayer({ name: "Asha" })).toMatchObject({
      ok: false,
      status: 409,
      fieldErrors: { email: "This email is already registered" },
    });
  });

  it("reports NOT_FOUND", async () => {
    vi.stubGlobal("fetch", respond(playerNotFoundMock, 404));
    expect(await getPlayer("x")).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });
});

describe("generateTemporaryPassword", () => {
  it("returns random readable passwords of the requested length", () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword(12);
    expect(a).toHaveLength(10);
    expect(b).toHaveLength(12);
    expect(a).not.toBe(generateTemporaryPassword());
    expect(a + b).not.toMatch(/[0O1lI]/);
  });
});
