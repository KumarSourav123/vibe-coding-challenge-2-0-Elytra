/**
 * One-time migration to multi-academy.
 *
 *   npm run migrate:academy
 *
 * Every user, player, session and match without an academy is moved into one
 * academy (default name "Sports Academy", override with MIGRATE_ACADEMY_NAME).
 * The earliest coach in it becomes Head Coach if it has none. Safe to re-run:
 * records that already have an academy are never touched.
 */
import { Academy, Match, Player, Session, User } from "@/backend/models";
import { createAcademy } from "@/backend/services/academyService";
import { ROLES } from "@/backend/utils/constants";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb";

const MODELS = { users: User, players: Player, sessions: Session, matches: Match };
const WITHOUT_ACADEMY = { $or: [{ academy: { $exists: false } }, { academy: null }] };

async function main() {
  await connectToDatabase();

  const counts = {};
  for (const [name, Model] of Object.entries(MODELS)) counts[name] = await Model.countDocuments(WITHOUT_ACADEMY);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log("Records without an academy:", counts);

  if (total === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  const name = process.env.MIGRATE_ACADEMY_NAME?.trim() || "Sports Academy";
  const academy = (await Academy.findOne({ name })) ?? (await createAcademy(name));
  console.log(`Using academy "${academy.name}" (${academy._id})`);

  // updateMany skips document validation, which is what we want for legacy rows.
  for (const [collection, Model] of Object.entries(MODELS)) {
    const { modifiedCount } = await Model.updateMany(WITHOUT_ACADEMY, { $set: { academy: academy._id } });
    console.log(`  ${collection.padEnd(9)} moved: ${modifiedCount}`);
  }

  if (!(await User.exists({ academy: academy._id, isHeadCoach: true }))) {
    const firstCoach = await User.findOne({ academy: academy._id, role: ROLES.COACH }).sort({ createdAt: 1 });
    if (firstCoach) {
      await User.updateOne({ _id: firstCoach._id }, { $set: { isHeadCoach: true } });
      await Academy.updateOne({ _id: academy._id }, { $set: { createdBy: firstCoach._id } });
      console.log(`  Head Coach: ${firstCoach.email}`);
    } else {
      console.log("  No coach found - create one by joining with the coach code below.");
    }
  }

  console.log("\nJoin codes (also visible to the Head Coach under Academy):");
  console.log(`  Coach: ${academy.coachJoinCode}`);
  console.log(`  Scout: ${academy.scoutJoinCode}`);
}

main()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectFromDatabase());
