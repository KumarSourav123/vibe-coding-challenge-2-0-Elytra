import mongoose from "mongoose";
import { Player, User } from "@/backend/models";
import { duplicateEmail } from "@/backend/services/authService";
import { ROLES } from "@/backend/utils/constants";
import { AppError } from "@/backend/utils/errors";
import { hashPassword } from "@/backend/utils/password";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Player management (docs/API_CONTRACTS.md §2.7-2.11). One shared academy:
 * every Coach can see and manage every player. Callers must already have
 * checked the COACH role.
 */

const notFound = () =>
  new AppError("Player not found", 404, [{ code: "NOT_FOUND", message: "Player not found" }]);

const noLoginAccount = () =>
  new AppError("This player has no login account", 409, [
    { code: "NO_LOGIN_ACCOUNT", message: "This player has no login account" },
  ]);

/** Public player shape: profile plus a summary of the linked login account. */
export function toPlayerDTO(player, user) {
  return {
    id: String(player._id),
    name: player.name,
    age: player.age,
    sport: player.sport,
    isActive: player.isActive,
    createdAt: player.createdAt,
    updatedAt: player.updatedAt,
    account: user
      ? { userId: String(user._id), email: user.email, mustChangePassword: Boolean(user.mustChangePassword) }
      : null,
  };
}

async function findPlayerOrThrow(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Validation failed", 400, [{ field: "id", code: "INVALID_ID", message: "Invalid player id" }]);
  }
  await connectToDatabase();
  const player = await Player.findById(id);
  if (!player) throw notFound();
  return player;
}

/**
 * Create the profile and its PLAYER login. If the login cannot be saved
 * (e.g. an email race), the profile is removed so no orphan is left behind.
 */
export async function createPlayer({ name, age, sport, email, temporaryPassword }, coach) {
  await connectToDatabase();
  if (await User.exists({ email })) throw duplicateEmail();

  const passwordHash = await hashPassword(temporaryPassword);
  const player = await Player.create({ name, age, sport, createdBy: coach._id });

  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.PLAYER,
      player: player._id,
      mustChangePassword: true,
    });
    return toPlayerDTO(player, user);
  } catch (error) {
    await Player.deleteOne({ _id: player._id });
    if (error?.code === 11000 && error.keyValue?.email) throw duplicateEmail();
    throw error;
  }
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** @param {{ sport: string|null, status: "active"|"inactive"|"all", search: string }} filters */
export async function listPlayers({ sport, status, search }) {
  await connectToDatabase();

  const query = {};
  if (sport) query.sport = sport;
  if (status !== "all") query.isActive = status === "active";

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    const matchingUsers = await User.find({ role: ROLES.PLAYER, email: pattern }).select("player");
    query.$or = [{ name: pattern }, { _id: { $in: matchingUsers.map((u) => u.player).filter(Boolean) } }];
  }

  const players = await Player.find(query).sort({ name: 1, _id: 1 });
  const users = await User.find({ player: { $in: players.map((p) => p._id) } });
  const userByPlayer = new Map(users.map((u) => [String(u.player), u]));

  return players.map((player) => toPlayerDTO(player, userByPlayer.get(String(player._id))));
}

export async function getPlayer(id) {
  const player = await findPlayerOrThrow(id);
  const user = await User.findOne({ player: player._id });
  return toPlayerDTO(player, user);
}

/**
 * Apply validated updates. Name is mirrored to the login account, email
 * updates the login, and isActive also enables/disables the login.
 */
export async function updatePlayer(id, updates) {
  const player = await findPlayerOrThrow(id);
  const user = await User.findOne({ player: player._id });

  if (updates.email !== undefined && !user) throw noLoginAccount();
  if (updates.email !== undefined && updates.email !== user.email) {
    if (await User.exists({ email: updates.email, _id: { $ne: user._id } })) throw duplicateEmail();
  }

  // Save the login first: its unique email is the update most likely to fail.
  if (user) {
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (user.isModified()) await user.save();
  }

  for (const field of ["name", "age", "sport", "isActive"]) {
    if (updates[field] !== undefined) player[field] = updates[field];
  }
  await player.save();

  return toPlayerDTO(player, user);
}

/** New temporary password; the player is signed out everywhere and must change it. */
export async function resetPlayerPassword(id, { temporaryPassword }) {
  const player = await findPlayerOrThrow(id);
  const user = await User.findOne({ player: player._id });
  if (!user) throw noLoginAccount();

  user.passwordHash = await hashPassword(temporaryPassword);
  user.mustChangePassword = true;
  user.sessionVersion += 1;
  await user.save();

  return toPlayerDTO(player, user);
}
