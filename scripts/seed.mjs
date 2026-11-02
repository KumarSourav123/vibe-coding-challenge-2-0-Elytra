/**
 * Development seed: creates one Coach, one Scout and one demo Player account.
 *
 *   npm run seed
 *
 * Reads MONGODB_URI and SEED_PASSWORD from .env.local. Existing accounts are
 * left untouched (the script is safe to re-run). Refuses to run in production.
 */
import { Player, User } from "@/backend/models";
import { ROLES } from "@/backend/utils/constants";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/backend/utils/password";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb";

const ACCOUNTS = [
  { name: "Coach Demo", email: "coach@academy.test", role: ROLES.COACH },
  { name: "Scout Demo", email: "scout@academy.test", role: ROLES.SCOUT },
  {
    name: "Player Demo",
    email: "player@academy.test",
    role: ROLES.PLAYER,
    player: { name: "Player Demo", age: 16, sport: "Cricket" },
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed with NODE_ENV=production.");
  }

  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Set SEED_PASSWORD (at least ${PASSWORD_MIN_LENGTH} characters) in .env.local.`);
  }

  await connectToDatabase();
  const passwordHash = await hashPassword(password);

  for (const account of ACCOUNTS) {
    if (await User.exists({ email: account.email })) {
      console.log(`skip    ${account.role.padEnd(6)} ${account.email} (already exists)`);
      continue;
    }

    const player = account.player ? await Player.create(account.player) : null;
    await User.create({
      name: account.name,
      email: account.email,
      role: account.role,
      passwordHash,
      player: player?._id ?? null,
    });
    console.log(`created ${account.role.padEnd(6)} ${account.email}`);
  }

  console.log("\nLog in at /login with these emails and your SEED_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectFromDatabase());
