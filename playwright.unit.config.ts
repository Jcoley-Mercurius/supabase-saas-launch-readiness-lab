import { defineConfig } from "@playwright/test";

/**
 * Unit and contract tests for the bounded evidence executor.
 *
 * These run in Node with no browser and no server, so they are kept in their
 * own configuration rather than added as a project to the browser matrix.
 * Playwright Test is the approved verification tool (MTS-CAP-009, MTS-SKL-003);
 * reusing it here avoids introducing a second, unapproved test runner.
 */
export default defineConfig({
  testDir: "./tests/unit",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
});
