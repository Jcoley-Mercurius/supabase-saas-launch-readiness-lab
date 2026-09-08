import { defineConfig, devices } from "@playwright/test";

/**
 * Baseline browser-verification harness (MTS-CAP-009, MTS-SKL-003).
 *
 * This configuration is infrastructure only. It asserts no product behavior.
 * Scenario, evidence, report, and inquiry specs are added by their own slices
 * (S1-S6) against approved MPS acceptance criteria and MDS states.
 *
 * Viewport projects match the approved MDS breakpoints:
 *   mobile 0-639 | tablet 640-959 | desktop 960-1279 | wide 1280+
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  /**
   * Next's dev server compiles routes on demand, so the first request from
   * each parallel worker can exceed Playwright's 30s default while the route
   * is still building. 60s absorbs that cold start without masking real hangs.
   */
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1200, height: 900 },
      },
    },
    {
      name: "chromium-wide",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "chromium-tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "firefox-desktop",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1200, height: 900 },
      },
    },
    // WebKit runs in CI only, not on this workstation.
    //
    // Its binaries are installed, but it needs 121 system packages on this
    // Ubuntu 26.04 host (the full GStreamer stack, Mesa, GTK4, ONNX Runtime).
    // Owner decision: do not install those locally; get WebKit evidence from a
    // CI runner using a Playwright image that ships the dependencies.
    //
    // CI enables this project via PLAYWRIGHT_WEBKIT=1. Wiring the workflow
    // itself belongs to S6 (release and combined verification).
    ...(process.env.PLAYWRIGHT_WEBKIT
      ? [
          {
            name: "webkit-desktop",
            use: {
              ...devices["Desktop Safari"],
              viewport: { width: 1200, height: 900 },
            },
          },
        ]
      : []),
  ],

  /*
   * The suite always builds and serves production, everywhere.
   *
   * It previously served `pnpm dev` locally, which meant every workstation run
   * exercised a development build: different bundling, no production
   * optimisation, and a dev-tools overlay that injected a control the approved
   * 44px touch-target assertion then measured. See MTS-OBS-027 and MTS-DEC-011.
   *
   * `reuseExistingServer` is false for the same reason it is false in CI. A
   * server already on the port is of unknown provenance, and attaching to one
   * is how a suite reports results for a build that is not the build under
   * test — the trap recorded in MTS-OBS-014. The cost is a rebuild per run;
   * the alternative is evidence that cannot be trusted.
   */
  webServer: {
    command: "pnpm build && pnpm start",
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
