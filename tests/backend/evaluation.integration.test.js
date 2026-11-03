import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GET as evaluationRoute } from "@/app/api/evaluation/route";
import { createAcademy } from "@/backend/services/academyService";
import { DEMO_ACADEMY_NAME } from "@/backend/utils/demoAccounts";
import { ROLES } from "@/backend/utils/constants";
import { createUser, startTestDatabase, stopTestDatabase } from "../helpers/db";

// Evaluation mode (docs/API_CONTRACTS.md §2.27).
describe("GET /api/evaluation", () => {
  let mongo;
  let demo;

  beforeAll(async () => {
    mongo = await startTestDatabase("sports-academy-evaluation-test");
    demo = await createAcademy(DEMO_ACADEMY_NAME);
    for (const [email, role] of [
      ["coach@academy.test", ROLES.COACH],
      ["scout@academy.test", ROLES.SCOUT],
    ]) {
      await createUser({ academy: demo._id, name: role, email, password: "demo-pass-123", role });
    }
    // A real (non-demo) account in the same academy must never be listed.
    await createUser({ academy: demo._id, name: "Real", email: "real@club.test", password: "real-pass-123", role: ROLES.COACH });
  });

  afterAll(() => stopTestDatabase(mongo));
  afterEach(() => vi.unstubAllEnvs());

  it("does not exist unless EVALUATION_MODE=true", async () => {
    for (const value of [undefined, "", "false", "TRUE", "1"]) {
      vi.stubEnv("EVALUATION_MODE", value);
      expect((await evaluationRoute()).status).toBe(404);
    }
  });

  it("shows the demo academy's join codes and the demo logins when enabled", async () => {
    vi.stubEnv("EVALUATION_MODE", "true");
    vi.stubEnv("SEED_PASSWORD", "demo-pass-123");
    const res = await evaluationRoute();
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data).toEqual({
      academy: { name: DEMO_ACADEMY_NAME },
      joinCodes: { coach: demo.coachJoinCode, scout: demo.scoutJoinCode },
      demoAccounts: [
        { role: "COACH", name: "Coach Demo", email: "coach@academy.test" },
        { role: "SCOUT", name: "Scout Demo", email: "scout@academy.test" },
      ],
      demoPassword: "demo-pass-123",
    });
  });

  it("never reveals real secrets or non-demo accounts", async () => {
    vi.stubEnv("EVALUATION_MODE", "true");
    const text = await (await evaluationRoute()).text();
    expect(text).not.toContain(process.env.AUTH_SECRET);
    expect(text).not.toContain(process.env.MONGODB_URI);
    expect(text).not.toContain("real@club.test");
    expect(text).not.toMatch(/passwordHash|scrypt/);
  });

  it("can point at another academy, and reports nothing if it doesn't exist", async () => {
    vi.stubEnv("EVALUATION_MODE", "true");
    const other = await createAcademy("Judging Academy");
    vi.stubEnv("EVALUATION_ACADEMY_NAME", "Judging Academy");
    const { data } = await (await evaluationRoute()).json();
    expect(data).toMatchObject({ academy: { name: "Judging Academy" }, joinCodes: { coach: other.coachJoinCode }, demoAccounts: [], demoPassword: null });

    vi.stubEnv("EVALUATION_ACADEMY_NAME", "Missing Academy");
    const missing = (await (await evaluationRoute()).json()).data;
    expect(missing).toEqual({ academy: null, joinCodes: null, demoAccounts: [], demoPassword: null });
  });
});
