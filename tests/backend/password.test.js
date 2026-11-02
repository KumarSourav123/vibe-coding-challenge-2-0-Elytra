import { describe, expect, it } from "vitest";
import { hashPassword, PASSWORD_HASH_PATTERN, verifyPassword } from "@/backend/utils/password";

describe("password hashing (scrypt)", () => {
  it("produces the documented storage format and never contains the password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).toMatch(PASSWORD_HASH_PATTERN);
    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(hash).not.toContain("secret123");
  });

  it("uses a random salt, so equal passwords hash differently", async () => {
    expect(await hashPassword("secret123")).not.toBe(await hashPassword("secret123"));
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
    expect(await verifyPassword("secret124", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("returns false for malformed or hostile stored hashes", async () => {
    expect(await verifyPassword("secret123", "secret123")).toBe(false);
    expect(await verifyPassword("secret123", null)).toBe(false);
    expect(await verifyPassword("secret123", "scrypt$99999999$8$1$c2FsdA==$aGFzaA==")).toBe(false);
  });

  it("rejects empty or non-string input when hashing", async () => {
    await expect(hashPassword("")).rejects.toThrow(TypeError);
    await expect(hashPassword(undefined)).rejects.toThrow(TypeError);
  });
});
