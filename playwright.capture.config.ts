import { defineConfig, devices } from "@playwright/test";

/**
 * MDS QA Gate 2 — render capture.
 *
 * Separate from `playwright.config.ts` on purpose. The gate suite asserts; this
 * one produces the rendered evidence a human compares against the approved
 * canonical references (mds/qa/MDS-QA.md, Gate 2). It must never become a
 * release gate: a capture run that "passes" proves only that files were
 * written, and Gate 2 is a judgement the owner makes, not an assertion.
 *
 * Run: pnpm qa:capture
 * Output: mds/qa/renders/
 *
 * It builds and serves production for the same reason the gate suite does
 * (MTS-DEC-011, MTS-OBS-014): evidence must come from the build under test.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./qa",
  testMatch: /capture\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  reporter: "list",

  use: {
    baseURL: BASE_URL,
    ...devices["Desktop Chrome"],
  },

  webServer: {
    command: "pnpm build && pnpm start",
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
