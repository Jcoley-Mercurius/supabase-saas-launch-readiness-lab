import { defineConfig } from "@playwright/test";

/**
 * Unit and contract tests for the bounded evidence executor.
 *
 * These run in Node with no browser and no server, so they are kept in their
 * own configuration rather than added as a project to the browser matrix.
 *
 * `pnpm test:unit` runs them under `--conditions=react-server`. The S5 inquiry
 * modules carry the documented `import "server-only"` guard, and that package
 * throws by design when it is resolved through any other export condition —
 * which is exactly the protection it exists to give in a Client Component. The
 * condition tells plain Node what the Next.js server bundler already knows, so
 * the guard can stay on the modules that need it and still be unit-testable.
 * Playwright Test is the approved verification tool (MTS-CAP-009, MTS-SKL-003);
 * reusing it here avoids introducing a second, unapproved test runner.
 */
export default defineConfig({
  testDir: "./tests/unit",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
});
