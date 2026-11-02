/**
 * Signed session tokens - implemented with Web Crypto only (no auth SDK).
 *
 * Format is a standard compact JWT using HS256 (HMAC-SHA256):
 *   base64url(header).base64url(payload).base64url(signature)
 *
 * Uses only Web-standard APIs (crypto.subtle, TextEncoder, btoa/atob), so the
 * same code runs in route handlers and in proxy.js.
 */

export const SESSION_COOKIE_NAME = "sa_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const MIN_SECRET_LENGTH = 32;
const HEADER = { alg: "HS256", typ: "JWT" };

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const keyCache = new Map();

export class AuthConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthConfigError";
    this.code = "AUTH_NOT_CONFIGURED";
  }
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function encodeJson(value) {
  return base64UrlEncode(encoder.encode(JSON.stringify(value)));
}

function decodeJson(value) {
  return JSON.parse(decoder.decode(base64UrlDecode(value)));
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new AuthConfigError(
      `AUTH_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters. See .env.example.`
    );
  }
  return secret;
}

async function getKey(secret) {
  if (!keyCache.has(secret)) {
    keyCache.set(
      secret,
      crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
        "verify",
      ])
    );
  }
  return keyCache.get(secret);
}

/**
 * Create a signed token.
 * @param {{ sub: string, role: string }} claims
 * @param {{ expiresInSeconds?: number, now?: number }} [options] `now` in seconds (tests)
 * @returns {Promise<string>}
 */
export async function signSessionToken(claims, { expiresInSeconds = SESSION_MAX_AGE_SECONDS, now } = {}) {
  const key = await getKey(getSecret());
  const iat = now ?? Math.floor(Date.now() / 1000);
  const unsigned = `${encodeJson(HEADER)}.${encodeJson({ ...claims, iat, exp: iat + expiresInSeconds })}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(unsigned));
  return `${unsigned}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Verify a token's signature, algorithm and expiry.
 * @returns {Promise<object | null>} The payload, or null if the token is invalid or expired.
 * @throws {AuthConfigError} If AUTH_SECRET is not configured.
 */
export async function verifySessionToken(token) {
  const key = await getKey(getSecret());
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signaturePart),
      encoder.encode(`${headerPart}.${payloadPart}`)
    );
    if (!valid) return null;

    const header = decodeJson(headerPart);
    if (header.alg !== HEADER.alg || header.typ !== HEADER.typ) return null;

    const payload = decodeJson(payloadPart);
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= now) return null;
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;

    return payload;
  } catch {
    // Malformed base64 or JSON.
    return null;
  }
}

/** Cookie options for the session cookie (HttpOnly - never readable by browser JS). */
export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
