import { describe, expect, it } from "vitest";
import { Match, Player, Session } from "@/backend/models";
import { normalizeSport } from "@/backend/utils/sport";

describe("normalizeSport", () => {
  it.each([
    ["cricket", "Cricket"],
    ["  CRICKET  ", "Cricket"],
    [" table  TENNIS ", "Table Tennis"],
    ["Football", "Football"],
    ["", ""],
  ])("%j -> %j", (input, expected) => {
    expect(normalizeSport(input)).toBe(expected);
  });

  it("leaves non-strings unchanged", () => {
    expect(normalizeSport(undefined)).toBeUndefined();
    expect(normalizeSport(42)).toBe(42);
  });

  it("is applied by the Player, Session and Match models", () => {
    const date = new Date("2026-11-02");
    expect(new Player({ name: "Ann", age: 15, sport: "table tennis" }).sport).toBe("Table Tennis");
    expect(new Session({ date, sport: " cricket" }).sport).toBe("Cricket");
    expect(new Match({ date, sport: "FOOTBALL", opponent: "X" }).sport).toBe("Football");
  });
});
