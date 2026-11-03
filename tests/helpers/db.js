import { MongoMemoryServer } from "mongodb-memory-server";
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { Match, Player, Session, User } from "@/backend/models";
import { hashPassword } from "@/backend/utils/password";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb";
import { makeRequest, sessionCookieFrom } from "./requests";

/** Start an in-memory MongoDB and connect the app's cached connection to it. */
export async function startTestDatabase(name) {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri(name);
  await connectToDatabase();
  await Promise.all([User.init(), Player.init(), Session.init(), Match.init()]);
  return mongo;
}

export async function stopTestDatabase(mongo) {
  await disconnectFromDatabase();
  await mongo?.stop();
  delete process.env.MONGODB_URI;
}

/** Create a user directly in the database with a real password hash. Pass `academy`. */
export async function createUser({ password, ...fields }) {
  return User.create({ ...fields, passwordHash: await hashPassword(password) });
}

/** Log in through the real route; returns `{ response, body, cookie }`. */
export async function loginAs(email, password) {
  const response = await loginRoute(makeRequest("/api/auth/login", { method: "POST", body: { email, password } }));
  return { response, body: await response.clone().json(), cookie: sessionCookieFrom(response) };
}
