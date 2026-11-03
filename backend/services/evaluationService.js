import { Academy, User } from "@/backend/models";
import { DEMO_ACADEMY_NAME, DEMO_ACCOUNTS } from "@/backend/utils/demoAccounts";
import { AppError } from "@/backend/utils/errors";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Evaluation mode (docs/API_CONTRACTS.md §2.27): for the competition judges,
 * publicly reveals the demo academy's join codes and the demo logins so they
 * can be copy-pasted. OFF unless EVALUATION_MODE=true. Never reveals
 * MONGODB_URI, AUTH_SECRET or any real user's password.
 */

export function isEvaluationMode() {
  return process.env.EVALUATION_MODE === "true";
}

export async function getEvaluationInfo() {
  // When off, behave as if the endpoint didn't exist.
  if (!isEvaluationMode()) {
    throw new AppError("Not found", 404, [{ code: "NOT_FOUND", message: "Not found" }]);
  }

  await connectToDatabase();
  const name = process.env.EVALUATION_ACADEMY_NAME?.trim() || DEMO_ACADEMY_NAME;
  const academy = await Academy.findOne({ name });

  // Only list demo accounts that really exist in that academy.
  const users = academy
    ? await User.find({ academy: academy._id, email: { $in: DEMO_ACCOUNTS.map((a) => a.email) }, isActive: true })
    : [];
  const existing = new Set(users.map((u) => u.email));

  return {
    academy: academy ? { name: academy.name } : null,
    joinCodes: academy ? { coach: academy.coachJoinCode, scout: academy.scoutJoinCode } : null,
    demoAccounts: DEMO_ACCOUNTS.filter((a) => existing.has(a.email)).map(({ email, role, name: accountName }) => ({
      role,
      name: accountName,
      email,
    })),
    // The shared password `npm run seed` gave the demo accounts.
    demoPassword: users.length ? process.env.SEED_PASSWORD || null : null,
  };
}
