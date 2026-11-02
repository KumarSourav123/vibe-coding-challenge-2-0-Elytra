import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    env: {
      // Test-only signing key; never use it outside tests.
      AUTH_SECRET: "test-only-secret-0123456789abcdefghijklmnop",
      COACH_SIGNUP_CODE: "test-coach-code",
      SCOUT_SIGNUP_CODE: "test-scout-code",
    },
    // The in-memory MongoDB binary is downloaded on first run.
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
