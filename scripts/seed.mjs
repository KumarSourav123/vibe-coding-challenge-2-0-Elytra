/**
 * Development seed: a "Demo Academy" with one Head Coach, one Scout and one
 * demo Player account.
 *
 *   npm run seed
 *
 * Reads MONGODB_URI and SEED_PASSWORD from .env.local. Existing accounts are
 * left untouched (the script is safe to re-run). Refuses to run in production.
 */
import { Academy, Player, User } from "@/backend/models";
import { createAcademy } from "@/backend/services/academyService";
import { DEMO_ACADEMY_NAME, DEMO_ACCOUNTS } from "@/backend/utils/demoAccounts";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/backend/utils/password";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb";

const ACADEMY_NAME = DEMO_ACADEMY_NAME;
const ACCOUNTS = DEMO_ACCOUNTS;

async function findOrCreateAcademy() {
  // Reuse the academy the demo coach already belongs to, if any.
  const coach = await User.findOne({ email: ACCOUNTS[0].email });
  if (coach?.academy) return Academy.findById(coach.academy);
  return (await Academy.findOne({ name: ACADEMY_NAME })) ?? createAcademy(ACADEMY_NAME);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed with NODE_ENV=production.");
  }

  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Set SEED_PASSWORD (at least ${PASSWORD_MIN_LENGTH} characters) in .env.local.`);
  }

  await connectToDatabase();
  const academy = await findOrCreateAcademy();
  const passwordHash = await hashPassword(password);

  for (const { player: profile, ...account } of ACCOUNTS) {
    if (await User.exists({ email: account.email })) {
      console.log(`skip    ${account.role.padEnd(6)} ${account.email} (already exists)`);
      continue;
    }

    const player = profile ? await Player.create({ ...profile, academy: academy._id }) : null;
    const user = await User.create({ ...account, academy: academy._id, passwordHash, player: player?._id ?? null });
    if (account.isHeadCoach && !academy.createdBy) {
      academy.createdBy = user._id;
      await academy.save();
    }
    console.log(`created ${account.role.padEnd(6)} ${account.email}`);
  }

  console.log(`\nAcademy: ${academy.name}`);
  console.log(`  Coach join code: ${academy.coachJoinCode}`);
  console.log(`  Scout join code: ${academy.scoutJoinCode}`);
  console.log("\nLog in at /login with these emails and your SEED_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectFromDatabase());
