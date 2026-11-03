import { randomInt } from "node:crypto";

/**
 * Academy join codes: XXXX-XXXX-XXXX from an unambiguous alphabet
 * (no 0/O, 1/I/L), so codes are easy to read out and type.
 * 32 characters x 12 positions = 60 bits of randomness.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GROUPS = 3;
const GROUP_LENGTH = 4;
export const JOIN_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function generateJoinCode() {
  const groups = [];
  for (let g = 0; g < GROUPS; g += 1) {
    let group = "";
    for (let i = 0; i < GROUP_LENGTH; i += 1) group += ALPHABET[randomInt(ALPHABET.length)];
    groups.push(group);
  }
  return groups.join("-");
}

/**
 * Canonical form of user input: " k7p2 9qx4-m3t8 " -> "K7P2-9QX4-M3T8".
 * Returns null if the input can't be a join code.
 */
export function normalizeJoinCode(value) {
  if (typeof value !== "string") return null;
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.length !== GROUPS * GROUP_LENGTH) return null;
  return compact.match(new RegExp(`.{${GROUP_LENGTH}}`, "g")).join("-");
}
