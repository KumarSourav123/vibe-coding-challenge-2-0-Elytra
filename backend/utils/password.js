import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with Node's built-in scrypt (no external library).
 * Stored format: scrypt$N$r$p$<salt base64>$<hash base64>
 */

const scryptAsync = promisify(scrypt);

const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const MAX_N = 2 ** 20; // Upper bound when parsing stored hashes, to cap CPU/memory cost.

export const PASSWORD_HASH_PATTERN = /^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

function derive(password, salt, { N, r, p }) {
  return scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: 256 * N * r,
  });
}

/** @returns {Promise<string>} Encoded hash safe to store in User.passwordHash. */
export async function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new TypeError("Password must be a non-empty string");
  }
  const salt = randomBytes(SALT_BYTES);
  const hash = await derive(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

/**
 * Compare a plain password with a stored hash in constant time.
 * Returns false (never throws) for malformed hashes.
 */
export async function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") return false;
  if (!PASSWORD_HASH_PATTERN.test(storedHash)) return false;

  const [, n, r, p, saltB64, hashB64] = storedHash.split("$");
  const params = { N: Number(n), r: Number(r), p: Number(p) };
  if (params.N < 2 || params.N > MAX_N || params.r < 1 || params.r > 32 || params.p < 1 || params.p > 16) {
    return false;
  }

  const expected = Buffer.from(hashB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), params);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
