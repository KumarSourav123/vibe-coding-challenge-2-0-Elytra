import mongoose from "mongoose";

/**
 * Reusable MongoDB connection utility.
 *
 * Next.js hot reloading (dev) and serverless invocations (Vercel) can evaluate
 * this module many times, so the connection promise is cached on `globalThis`
 * to avoid opening a new connection pool on every request.
 *
 * Server-only: never import this file from frontend code.
 */

const READY_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const globalCache = globalThis.__mongooseCache ?? { conn: null, promise: null };
globalThis.__mongooseCache = globalCache;

export class DatabaseConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseConfigError";
    this.code = "DB_NOT_CONFIGURED";
  }
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === "your_mongodb_connection_string") {
    throw new DatabaseConfigError(
      "MONGODB_URI is not configured. Copy .env.example to .env.local and set a real connection string."
    );
  }
  return uri;
}

/**
 * Connect to MongoDB (or reuse the cached connection).
 * @param {object} [options]
 * @param {string} [options.uri] Override the URI (used by tests).
 * @returns {Promise<typeof mongoose>}
 */
export async function connectToDatabase({ uri } = {}) {
  if (globalCache.conn && mongoose.connection.readyState === 1) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const mongoUri = uri ?? getMongoUri();
    globalCache.promise = mongoose
      .connect(mongoUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      })
      .then((instance) => instance);
  }

  try {
    globalCache.conn = await globalCache.promise;
  } catch (error) {
    // Reset so the next request can retry instead of reusing a failed promise.
    globalCache.promise = null;
    globalCache.conn = null;
    throw error;
  }

  return globalCache.conn;
}

/** Close the cached connection (used by tests and scripts). */
export async function disconnectFromDatabase() {
  await mongoose.disconnect();
  globalCache.conn = null;
  globalCache.promise = null;
}

/** Human-readable state of the current mongoose connection. */
export function getConnectionState() {
  return READY_STATES[mongoose.connection.readyState] ?? "unknown";
}

/** Round-trip ping to the database. Resolves with latency in milliseconds. */
export async function pingDatabase() {
  const startedAt = Date.now();
  await mongoose.connection.db.admin().ping();
  return Date.now() - startedAt;
}
