import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { Match, Player, Session, User } from "@/backend/models";
import { ATTENDANCE_STATUS, ROLES } from "@/backend/utils/constants";
import { handleRouteError } from "@/backend/utils/errors";
import { connectToDatabase, disconnectFromDatabase, getConnectionState } from "@/lib/mongodb";
import { FAKE_PASSWORD_HASH } from "../helpers/fixtures";

// Runs against a real (in-memory) MongoDB instance to verify actual database operations.
describe("MongoDB integration", () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri("sports-academy-test");
    await connectToDatabase();
    await Promise.all([User.init(), Player.init(), Session.init(), Match.init()]);
  });

  afterAll(async () => {
    await disconnectFromDatabase();
    await mongo?.stop();
    delete process.env.MONGODB_URI;
  });

  it("reuses the cached connection", async () => {
    const first = await connectToDatabase();
    const second = await connectToDatabase();
    expect(first).toBe(second);
    expect(getConnectionState()).toBe("connected");
  });

  it("GET /api/health reports connected", async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Service is healthy");
    expect(body.data.database.status).toBe("connected");
    expect(typeof body.data.database.latencyMs).toBe("number");
    expect(body.data.app.status).toBe("ok");
  });

  it("persists and reads back all four models", async () => {
    const player = await Player.create({ name: "Asha", age: 17, sport: "Cricket" });
    await User.create({
      name: "Asha",
      email: "asha@example.com",
      passwordHash: FAKE_PASSWORD_HASH,
      role: ROLES.PLAYER,
      player: player._id,
    });
    const session = await Session.create({
      date: new Date("2026-11-02T00:00:00.000Z"),
      sport: "Cricket",
      attendance: [{ player: player._id, status: ATTENDANCE_STATUS.PRESENT }],
    });
    await Match.create({
      date: new Date("2026-11-02T00:00:00.000Z"),
      sport: "Cricket",
      opponent: "City XI",
      participants: [{ player: player._id, score: 55 }],
    });

    const storedUser = await User.findOne({ email: "asha@example.com" }).populate("player");
    expect(storedUser.player.name).toBe("Asha");
    expect(storedUser.passwordHash).toBeUndefined(); // select: false

    const storedSession = await Session.findById(session._id);
    expect(storedSession.attendance[0].status).toBe("PRESENT");

    const matches = await Match.find({ "participants.player": player._id });
    expect(matches).toHaveLength(1);
  });

  it("enforces unique email and maps it to a 409 response", async () => {
    const data = { name: "Dup", email: "dup@example.com", passwordHash: FAKE_PASSWORD_HASH, role: ROLES.SCOUT };
    await User.create(data);
    const error = await User.create(data).catch((err) => err);
    expect(error.code).toBe(11000);
    const res = handleRouteError(error);
    expect(res.status).toBe(409);
  });
});
