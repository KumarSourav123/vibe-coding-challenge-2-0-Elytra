import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { Match, Player, Session, User } from "@/backend/models";
import { ATTENDANCE_STATUS, ROLES, SESSION_STATUS } from "@/backend/utils/constants";
import { FAKE_PASSWORD_HASH } from "../helpers/fixtures";
import { validationError } from "../helpers/validation";

const id = () => new mongoose.Types.ObjectId();

describe("User model", () => {
  const valid = { academy: id(), name: "Coach Carter", email: "COACH@Example.com ", passwordHash: FAKE_PASSWORD_HASH, role: ROLES.COACH };

  it("accepts a valid user and normalises email", async () => {
    const user = new User(valid);
    expect(await validationError(user)).toBeUndefined();
    expect(user.email).toBe("coach@example.com");
  });

  it("rejects an unknown role and invalid email", async () => {
    const err = await validationError(new User({ ...valid, role: "ADMIN", email: "nope" }));
    expect(Object.keys(err.errors).sort()).toEqual(["email", "role"]);
  });

  it("only allows PLAYER accounts to link a player profile", async () => {
    const coachErr = await validationError(new User({ ...valid, player: id() }));
    expect(coachErr.errors.player).toBeDefined();
    expect(await validationError(new User({ ...valid, role: ROLES.PLAYER, player: id() }))).toBeUndefined();
  });

  it("rejects a plain-text password in passwordHash", async () => {
    const err = await validationError(new User({ ...valid, passwordHash: "secret123" }));
    expect(err.errors.passwordHash.message).toBe("Password must be hashed before saving");
  });

  it("never serialises passwordHash", () => {
    const json = new User(valid).toJSON();
    expect(json.passwordHash).toBeUndefined();
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
  });
});

describe("Player model", () => {
  it("requires name, age and sport", async () => {
    const err = await validationError(new Player({}));
    expect(Object.keys(err.errors).sort()).toEqual(["academy", "age", "name", "sport"]);
  });

  it("rejects non-integer or out-of-range age", async () => {
    const fractional = await validationError(new Player({ academy: id(), name: "Ann", age: 12.5, sport: "Cricket" }));
    expect(fractional.errors.age).toBeDefined();
    const tooYoung = await validationError(new Player({ academy: id(), name: "Ann", age: 2, sport: "Cricket" }));
    expect(tooYoung.errors.age).toBeDefined();
  });

  it("accepts a valid player", async () => {
    expect(await validationError(new Player({ academy: id(), name: "Ann", age: 16, sport: " Cricket " }))).toBeUndefined();
  });
});

describe("Session model", () => {
  const base = { academy: id(), date: new Date("2026-11-02"), sport: "Cricket" };

  it("defaults to OPEN with empty attendance", async () => {
    const session = new Session(base);
    expect(await validationError(session)).toBeUndefined();
    expect(session.status).toBe(SESSION_STATUS.OPEN);
    expect(session.attendance).toHaveLength(0);
  });

  it("rejects duplicate attendance for the same player", async () => {
    const player = id();
    const err = await validationError(
      new Session({
        ...base,
        attendance: [
          { player, status: ATTENDANCE_STATUS.PRESENT },
          { player, status: ATTENDANCE_STATUS.ABSENT },
        ],
      })
    );
    expect(err.errors.attendance.message).toBe("Each player can appear only once");
  });

  it("rejects invalid attendance status", async () => {
    const err = await validationError(new Session({ ...base, attendance: [{ player: id(), status: "LATE" }] }));
    expect(err.errors["attendance.0.status"]).toBeDefined();
  });
});

describe("Match model", () => {
  const base = { academy: id(), date: new Date("2026-11-02"), sport: "Cricket", opponent: "City XI" };

  it("accepts a valid match", async () => {
    expect(await validationError(new Match({ ...base, participants: [{ player: id(), score: 42 }] }))).toBeUndefined();
  });

  it("requires date, sport and opponent", async () => {
    const err = await validationError(new Match({}));
    expect(Object.keys(err.errors).sort()).toEqual(["academy", "date", "opponent", "sport"]);
  });

  it("rejects duplicate participants and negative scores", async () => {
    const player = id();
    const dup = await validationError(
      new Match({ ...base, participants: [{ player, score: 1 }, { player, score: 2 }] })
    );
    expect(dup.errors.participants).toBeDefined();
    const neg = await validationError(new Match({ ...base, participants: [{ player: id(), score: -1 }] }));
    expect(neg.errors["participants.0.score"]).toBeDefined();
  });
});
