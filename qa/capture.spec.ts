import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * MDS QA Gate 2 — rendered evidence capture.
 *
 * Gate 2 requires that, "for each applicable reference, compare rendered output
 * at the intended viewport", and forbids claiming exact or pixel-perfect
 * fidelity "unless a meaningful rendered comparison was performed". This file
 * produces the rendered half of that comparison: one PNG per reference, route,
 * state, and viewport, written to `mds/qa/renders/`.
 *
 * It asserts nothing about fidelity. Comparing a render to an approved
 * reference is a visual judgement, and the approved authority order puts that
 * judgement with the owner. What this file guarantees is only that the render
 * is of the state it claims to be: every capture waits for the evidence that
 * state is real before the shutter opens.
 *
 * Naming: `<reference>-<subject>-<state>-<width>.png`, so a render can be
 * traced back to the row of the Gate 2 table it belongs to.
 */

const RENDERS = join(process.cwd(), "mds/qa/renders");
mkdirSync(RENDERS, { recursive: true });

const LAB = "/scenarios/authorization-and-rls";

/** The intended viewports, per MDS responsive.breakpoints. */
const WIDE = { width: 1440, height: 900 };
const DESKTOP = { width: 1200, height: 900 };
const TABLET = { width: 768, height: 1024 };
const MOBILE = { width: 390, height: 844 };

async function open(page: Page, route: string) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("main")).toBeVisible();
  // Settle before the shutter: a capture taken in the same task as a layout
  // change records a frame the browser never painted.
  await page.waitForTimeout(400);
}

async function shoot(page: Page, name: string, fullPage = true) {
  await page.screenshot({ path: join(RENDERS, `${name}.png`), fullPage });
}

async function shootRegion(page: Page, selector: string, name: string) {
  const region = page.locator(selector).first();
  await expect(region).toBeVisible();
  await region.screenshot({ path: join(RENDERS, `${name}.png`) });
}

async function runVulnerable(page: Page) {
  await page.getByRole("button", { name: "Run the documented test" }).click();
  await expect(
    page.getByRole("heading", { name: "Before — vulnerable state" }).first(),
  ).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(400);
}

async function runRemediated(page: Page) {
  await page
    .getByRole("button", { name: "Apply remediation and repeat the test" })
    .click();
  await expect(
    page.getByText("Remediated — documented test blocked").first(),
  ).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(400);
}

/*
 * Inquiry states are driven by intercepting the endpoint and returning exactly
 * what the server returns, which is the approach the S5 suite established and
 * its header explains: the buyer-visible state is the subject, and the server's
 * own decision logic is proved separately against the real database. It also
 * means a capture run never writes an inquiry row.
 */
const FILLED = {
  Name: "Alex Rivera",
  "Work email": "alex@acme.dev",
  "Company or project": "Acme Analytics",
  "Your role": "Founder / CTO",
  "Your stack": "Next.js on Vercel, Supabase Postgres, Stripe webhooks",
};

async function fillForm(page: Page) {
  for (const [label, value] of Object.entries(FILLED)) {
    await page.getByLabel(label, { exact: false }).first().fill(value);
  }
  await page
    .getByLabel(/What's prompting this review/i)
    .selectOption({ label: "Preparing to launch" });
  await page.getByRole("checkbox", { name: "Authorization & RLS" }).check();
  await page
    .getByLabel(/What would you like reviewed/i)
    .fill(
      "We are preparing to launch a multi-tenant SaaS and want the RLS policies reviewed.",
    );
  await page
    .getByLabel(/Who can authorize a review/i)
    .selectOption({ label: "I can authorize a review of this system" });
  await page
    .getByRole("checkbox", {
      name: /work on a live system begins only after authorization/i,
    })
    .check();
}

async function respondWith(page: Page, status: number, body: unknown) {
  await page.route("**/api/inquiries", (route: Route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );
}

async function submit(page: Page) {
  await page.getByRole("button", { name: /Submit review inquiry/i }).click();
}

test.describe("MDS-REF-002 — landing narrative hierarchy", () => {
  test("landing at wide, desktop, tablet, and mobile", async ({ page }) => {
    for (const [label, viewport] of [
      ["1440", WIDE],
      ["1200", DESKTOP],
      ["768", TABLET],
      ["390", MOBILE],
    ] as const) {
      await page.setViewportSize(viewport);
      await open(page, "/");
      await shoot(page, `ref-002-landing-${label}`);
      // The hero alone, at the fold, is what the reference frames.
      await shoot(page, `ref-002-landing-fold-${label}`, false);
    }
  });
});

test.describe("MDS-REF-005 — scenario index composition", () => {
  test("scenario index at every card transformation", async ({ page }) => {
    for (const [label, viewport] of [
      ["1440", WIDE],
      ["1200", DESKTOP],
      ["768", TABLET],
      ["390", MOBILE],
    ] as const) {
      await page.setViewportSize(viewport);
      await open(page, "/scenarios");
      await shoot(page, `ref-005-scenario-index-${label}`);
    }
  });
});

test.describe("MDS-REF-006 — guided evidence workspace", () => {
  test("the lab in its untested, vulnerable, and remediated states", async ({
    page,
  }) => {
    for (const [label, viewport] of [
      ["1440", WIDE],
      ["390", MOBILE],
    ] as const) {
      await page.setViewportSize(viewport);

      await open(page, LAB);
      await shoot(page, `ref-006-lab-untested-${label}`);

      await runVulnerable(page);
      await shoot(page, `ref-006-lab-vulnerable-${label}`);

      await runRemediated(page);
      await shoot(page, `ref-006-lab-remediated-${label}`);
    }
  });

  test("the rail at wide and the in-flow selector below desktop", async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    await open(page, LAB);
    await shootRegion(
      page,
      "main nav[aria-label='Scenarios']",
      "ref-006-rail-1440",
    );

    await page.setViewportSize(TABLET);
    await open(page, LAB);
    await shootRegion(page, "main details", "ref-006-selector-768");
  });
});

test.describe("MDS-REF-007 — buyer-readable report", () => {
  test("the report shell and each named section", async ({ page }) => {
    /*
     * The report is over 43,000 px tall at 1440, so a single full-page capture
     * would be unreadable as a comparison. It is captured as the fold plus one
     * render per approved section, which is the unit the reference is drawn in.
     */
    await page.setViewportSize(WIDE);
    await open(page, "/report");
    await shoot(page, "ref-007-report-fold-1440", false);

    const sections = [
      "executive-summary",
      "severity-overview",
      "findings",
      "coverage-matrix",
      "webhook-recovery",
      "remediation",
      "method-limitations",
      "case-study",
    ];
    for (const id of sections) {
      const section = page.locator(`#${id}`).first();
      if ((await section.count()) === 0) continue;
      await section.screenshot({
        path: join(RENDERS, `ref-007-section-${id}-1440.png`),
      });
    }

    await page.setViewportSize(MOBILE);
    await open(page, "/report");
    await shoot(page, "ref-007-report-fold-390", false);
    await shootRegion(
      page,
      "nav[aria-label='Report sections']",
      "ref-007-report-index-inflow-390",
    );
  });

  test("the report as it prints", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await open(page, "/report");
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(300);
    await shoot(page, "ref-007-report-print-fold-1440", false);
    await shootRegion(
      page,
      "#severity-overview",
      "ref-007-print-severity-1440",
    );
    await page.emulateMedia({ media: null });
  });
});

test.describe("MDS-REF-008 — inquiry fields and feedback states", () => {
  test("initial, invalid, acknowledged, duplicate, and failed", async ({
    page,
  }) => {
    /*
     * Every response body below is the shape the route actually returns, taken
     * from the S5 suite that verifies each state against it. A capture that
     * posts a shape the client does not recognise renders the form unchanged
     * and would be filed as a render of a state it never reached.
     *
     * Each capture waits for the state's own text before the shutter opens.
     */
    for (const [label, viewport] of [
      ["1440", WIDE],
      ["390", MOBILE],
    ] as const) {
      await page.setViewportSize(viewport);
      /*
       * Interceptors registered for the previous viewport's states are still
       * installed on this page. Clearing them means each state below is driven
       * only by the response it registers itself.
       */
      await page.unrouteAll({ behavior: "ignoreErrors" });

      await open(page, "/inquiry");
      await shoot(page, `ref-008-inquiry-initial-${label}`);

      // Invalid: submitted with nothing filled in.
      await submit(page);
      /*
       * Next renders its own route announcer with role="alert" into every page,
       * so the form's alert is scoped the way the S5 suite scopes it.
       */
      await expect(
        page.locator('[role="alert"]:not(#__next-route-announcer__)').first(),
      ).toBeVisible();
      await page.waitForTimeout(300);
      await shoot(page, `ref-008-inquiry-invalid-${label}`);

      await open(page, "/inquiry");
      await respondWith(page, 201, {
        state: "acknowledged",
        delivered: true,
        authorizationBoundary: false,
      });
      await fillForm(page);
      await submit(page);
      await expect(page.getByRole("status")).toContainText(/Inquiry received/i);
      await page.waitForTimeout(300);
      await shoot(page, `ref-008-inquiry-acknowledged-${label}`);

      await open(page, "/inquiry");
      await respondWith(page, 200, {
        state: "duplicate",
        submittedAt: "2026-08-01T10:00:00.000Z",
        submissionCount: 3,
        authorizationBoundary: false,
      });
      await fillForm(page);
      await submit(page);
      await expect(page.getByRole("status")).toContainText(
        /already on record/i,
      );
      await page.waitForTimeout(300);
      await shoot(page, `ref-008-inquiry-duplicate-${label}`);

      await open(page, "/inquiry");
      await respondWith(page, 503, { state: "unconfirmed", reason: "store" });
      await fillForm(page);
      await submit(page);
      await expect(page.getByRole("status")).toBeVisible();
      await page.waitForTimeout(300);
      await shoot(page, `ref-008-inquiry-failed-${label}`);

      // The authorization boundary: an inquiry naming someone else's system.
      await open(page, "/inquiry");
      await respondWith(page, 201, {
        state: "acknowledged",
        delivered: true,
        authorizationBoundary: true,
      });
      await fillForm(page);
      await submit(page);
      await expect(page.getByRole("status")).toContainText(/Inquiry received/i);
      await page.waitForTimeout(300);
      await shoot(page, `ref-008-inquiry-authorization-boundary-${label}`);
    }
  });
});

test.describe("MDS-REF-001 and MDS-REF-003 — foundations and components", () => {
  test("the evidence-state language and the shared components", async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);

    await open(page, "/report");
    await shootRegion(
      page,
      "#severity-overview",
      "ref-001-state-language-1440",
    );
    await shootRegion(page, "#coverage-matrix", "ref-003-coverage-matrix-1440");
    await shootRegion(
      page,
      "section[aria-label='Finding summary']",
      "ref-003-finding-summary-1440",
    );
    await shootRegion(
      page,
      "section[aria-label='Before and after comparison']",
      "ref-003-before-after-1440",
    );
    await shootRegion(
      page,
      "div[aria-label='Evidence view']",
      "ref-003-code-excerpt-1440",
    );

    await open(page, LAB);
    await shootRegion(
      page,
      "nav[aria-label='Scenario steps']",
      "ref-003-stepper-untested-1440",
    );
    await runVulnerable(page);
    await shootRegion(
      page,
      "nav[aria-label='Scenario steps']",
      "ref-003-stepper-vulnerable-1440",
    );

    await open(page, "/scenarios");
    /*
     * The list that holds the scenario links, not the first `ul` in `main` -
     * which is the service-boundary note list, and was captured under this name
     * once before the selector was corrected.
     */
    await shootRegion(
      page,
      "main ul:has(a[href^='/scenarios/'])",
      "ref-003-scenario-cards-1440",
    );
  });
});

test.describe("MDS-REF-004 — responsive transformations", () => {
  test("the same two routes across every approved breakpoint", async ({
    page,
  }) => {
    const widths = [390, 640, 768, 960, 1280, 1440];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const [route, name] of [
        ["/", "landing"],
        ["/scenarios", "scenarios"],
        [LAB, "lab"],
        ["/report", "report"],
        ["/inquiry", "inquiry"],
      ] as const) {
        await open(page, route);
        await shoot(page, `ref-004-${name}-${width}`, false);
      }
    }
  });
});

test.describe("MDS-REF-009 — mobile composition and reading order", () => {
  test("the routes no other reference captures at 390", async ({ page }) => {
    /*
     * Landing, scenario index, lab, report, and inquiry are already captured at
     * 390 by MDS-REF-002, 005, 006, 007, and 008. Those files are the MDS-REF-009
     * evidence for those routes as well - the Gate 2 table in the report names
     * them - so only the routes no other reference covers are captured here.
     */
    await page.setViewportSize(MOBILE);
    for (const [route, name] of [
      ["/scenarios/webhook-integrity", "webhook"],
      ["/method", "method"],
      ["/about", "about"],
    ] as const) {
      await open(page, route);
      await shoot(page, `ref-009-${name}-390`);
    }
  });
});
