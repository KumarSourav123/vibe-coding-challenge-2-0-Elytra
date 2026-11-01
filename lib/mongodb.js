import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Attempt to load .env.local if not already in process.env (e.g. standalone scripts or CLI execution)
if (!process.env.MONGODB_URI && typeof process.loadEnvFile === 'function') {
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const candidatePaths = [
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(currentDir, '../.env.local'),
      path.resolve(process.cwd(), '..', '.env.local'),
    ];

    for (const envPath of candidatePaths) {
      if (fs.existsSync(envPath)) {
        process.loadEnvFile(envPath);
        if (process.env.MONGODB_URI) break;
      }
    }
  } catch {
    // Graceful fallback if .env.local is handled elsewhere or not accessible
  }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and multiple function invocations in serverless environments.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB database using Mongoose with connection pooling.
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Please verify MONGODB_URI in .env.local at the project root and restart your Next.js server.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Check the current MongoDB connection state.
 * @returns {{ isConnected: boolean, state: string, readyState: number }}
 */
export function getConnectionStatus() {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    isConnected: readyState === 1,
    state: states[readyState] || 'unknown',
    readyState,
  };
}

export default connectDB;
