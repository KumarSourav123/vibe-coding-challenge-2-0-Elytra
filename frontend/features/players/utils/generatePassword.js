// No look-alike characters (0/O, 1/l/I) so the password is easy to read out to a player.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** Random temporary password from the browser's crypto RNG. */
export function generateTemporaryPassword(length = 10) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // 256 % 54 bias is negligible for a short-lived temporary password.
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}
