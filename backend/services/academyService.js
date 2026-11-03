import { Academy, User } from "@/backend/models";
import { ROLES } from "@/backend/utils/constants";
import { AppError } from "@/backend/utils/errors";
import { generateJoinCode, normalizeJoinCode } from "@/backend/utils/joinCode";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Academies (tenants) and their join codes (docs/API_CONTRACTS.md §1.6, §2.5–2.5e).
 */

const CODE_FIELD_BY_ROLE = { [ROLES.COACH]: "coachJoinCode", [ROLES.SCOUT]: "scoutJoinCode" };
const MAX_CODE_ATTEMPTS = 5;

export const invalidJoinCode = () =>
  new AppError("Invalid join code", 400, [
    { field: "joinCode", code: "INVALID_JOIN_CODE", message: "This join code doesn't match any academy" },
  ]);

const isDuplicateCode = (error) =>
  error?.code === 11000 && Object.keys(error.keyValue ?? {}).some((key) => key.endsWith("JoinCode"));

/** Retry on the (astronomically unlikely) event of a join-code collision. */
async function withFreshCodes(operation) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isDuplicateCode(error) || attempt >= MAX_CODE_ATTEMPTS) throw error;
    }
  }
}

export function createAcademy(name) {
  return withFreshCodes(() =>
    Academy.create({ name, coachJoinCode: generateJoinCode(), scoutJoinCode: generateJoinCode() })
  );
}

/**
 * Resolve a join code to its academy and the role it grants.
 * @returns {Promise<{ academy: import("mongoose").Document, role: "COACH"|"SCOUT" }>}
 * @throws {AppError} 400 INVALID_JOIN_CODE
 */
export async function resolveJoinCode(rawCode) {
  const code = normalizeJoinCode(rawCode);
  if (!code) throw invalidJoinCode();
  await connectToDatabase();
  const academy = await Academy.findOne({ $or: [{ coachJoinCode: code }, { scoutJoinCode: code }] });
  if (!academy) throw invalidJoinCode();
  return { academy, role: academy.coachJoinCode === code ? ROLES.COACH : ROLES.SCOUT };
}

/** Public join-code preview (§2.5b): only the academy name and role. */
export async function lookupJoinCode(rawCode) {
  const { academy, role } = await resolveJoinCode(rawCode);
  return { academy: { name: academy.name }, role };
}

async function findUserAcademy(user) {
  await connectToDatabase();
  const academy = await Academy.findById(user.academy);
  if (!academy) throw new AppError("Academy not found", 404, [{ code: "NOT_FOUND", message: "Academy not found" }]);
  return academy;
}

/** §2.5c: academy, its coaches and scouts, and join codes for the Head Coach. */
async function toOverview(academy, user) {
  const members = await User.find({ academy: academy._id, role: { $in: [ROLES.COACH, ROLES.SCOUT] } }).sort({
    isHeadCoach: -1,
    role: 1,
    name: 1,
  });
  return {
    academy: { id: String(academy._id), name: academy.name, createdAt: academy.createdAt },
    members: members.map((m) => ({
      id: String(m._id),
      name: m.name,
      email: m.email,
      role: m.role,
      isHeadCoach: Boolean(m.isHeadCoach),
    })),
    joinCodes: user.isHeadCoach ? { coach: academy.coachJoinCode, scout: academy.scoutJoinCode } : null,
  };
}

export async function getAcademyOverview(user) {
  return toOverview(await findUserAcademy(user), user);
}

/** Head Coach only - the route checks the role. */
export async function renameAcademy(user, { name }) {
  const academy = await findUserAcademy(user);
  academy.name = name;
  await academy.save();
  return toOverview(academy, user);
}

/** Head Coach only. The old code stops working immediately. */
export async function regenerateJoinCode(user, { role }) {
  const field = CODE_FIELD_BY_ROLE[role];
  const academy = await withFreshCodes(async () => {
    const current = await findUserAcademy(user);
    current[field] = generateJoinCode();
    return current.save();
  });
  return toOverview(academy, user);
}
