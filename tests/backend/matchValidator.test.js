import { describe, expect, it } from "vitest";
import {
  validateCreateMatchInput,
  validateEligibleQuery,
  validateMatchQuery,
  validateUpdateMatchInput,
} from "@/backend/validators/matchValidator";

function fieldErrors(fn) {
  try {
    fn();
  } catch (error) {
    expect(error.statusCode).toBe(400);
    return Object.fromEntries(error.errors.map((e) => [e.field, e.message]));
  }
  throw new Error("expected validation to fail");
}

const A = "665000000000000000000101";
const B = "665000000000000000000102";
const valid = { date: "2026-11-02", sport: " cricket ", opponent: " City XI ", participants: [{ playerId: A, score: 55 }] };

describe("validateCreateMatchInput", () => {
  it("normalises valid input", () => {
    const input = validateCreateMatchInput(valid);
    expect(input.date.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(input).toMatchObject({ sport: "Cricket", opponent: "City XI", participants: [{ playerId: A, score: 55 }] });
  });

  it("accepts zero and decimal scores", () => {
    const input = validateCreateMatchInput({
      ...valid,
      participants: [
        { playerId: A, score: 0 },
        { playerId: B, score: 7.5 },
      ],
    });
    expect(input.participants.map((p) => p.score)).toEqual([0, 7.5]);
  });

  it("requires every field and at least one participant", () => {
    expect(Object.keys(fieldErrors(() => validateCreateMatchInput({}))).sort()).toEqual([
      "date",
      "opponent",
      "participants",
      "sport",
    ]);
    expect(fieldErrors(() => validateCreateMatchInput({ ...valid, participants: [] })).participants).toBe(
      "Select at least one player"
    );
  });

  it("rejects bad ids, duplicate players and invalid scores", () => {
    const errors = fieldErrors(() =>
      validateCreateMatchInput({
        ...valid,
        participants: [
          { playerId: "nope", score: 1 },
          { playerId: A, score: -1 },
          { playerId: A, score: 10 },
          { playerId: B, score: "12" },
          { playerId: "665000000000000000000103", score: 100001 },
        ],
      })
    );
    expect(errors).toEqual({
      "participants.0.playerId": "Player id is invalid",
      "participants.1.score": "Score must be between 0 and 100000",
      "participants.2.playerId": "Each player can appear only once per match",
      "participants.3.score": "Score must be a number",
      "participants.4.score": "Score must be between 0 and 100000",
    });
  });
});

describe("validateUpdateMatchInput", () => {
  it("returns only provided fields", () => {
    expect(validateUpdateMatchInput({ opponent: "Town FC", date: "2026-01-01" })).toEqual({ opponent: "Town FC" });
  });

  it("requires opponent or participants", () => {
    expect(fieldErrors(() => validateUpdateMatchInput({})).body).toBeDefined();
    expect(fieldErrors(() => validateUpdateMatchInput({ participants: [] })).participants).toBeDefined();
  });
});

describe("query validators", () => {
  it("eligible-players needs date and sport", () => {
    expect(Object.keys(fieldErrors(() => validateEligibleQuery(new URLSearchParams(""))))).toEqual(["date", "sport"]);
    const query = validateEligibleQuery(new URLSearchParams("date=2026-11-02&sport=table%20tennis"));
    expect(query.sport).toBe("Table Tennis");
  });

  it("match list sport is optional", () => {
    expect(validateMatchQuery(new URLSearchParams(""))).toEqual({ sport: null });
    expect(validateMatchQuery(new URLSearchParams("sport=CRICKET"))).toEqual({ sport: "Cricket" });
  });
});
