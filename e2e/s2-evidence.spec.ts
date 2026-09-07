import { expect, test, type Page } from "@playwright/test";
import { measureContrastFailures } from "./contrast";

/*
 * S2 browser verification — the deterministic evidence engine and RLS proof.
 *
 * Trace: MPS-REQ-002/003/004/005/012/013, MPS-RULE-001/002/003/004/007,
 *        MPS-ACC-002/003/004/005/006/014/015;
 *        MDS DESIGN-SYSTEM.md §9-12; MDS-REF-006, MDS-REF-009 panel 3;
 *        MTS qa/MTS-QA.md.
 */

const LAB = "/scenarios/authorization-and-rls";
const STORAGE_LAB = "/scenarios/storage-and-configuration";

async function runVulnerable(page: Page) {
  await page.getByRole("button", { name: "Run the documented test" }).click();
  // One pair per documented test, so this heading repeats by design.
  await expect(
    page.getByRole("heading", { name: "Before — vulnerable state" }).first(),
  ).toBeVisible({ timeout: 20_000 });
}

async function runRemediated(page: Page) {
  await page
    .getByRole("button", { name: "Apply remediation and repeat the test" })
    .click();
  await expect(
    page.getByText("Remediated — documented test blocked").first(),
  ).toBeVisible({ timeout: 20_000 });
}

test.describe("the lab starts untested and never implies a pass", () => {
  test("no result is shown before a documented test is run", async ({
    page,
  }) => {
    await page.goto(LAB);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Authorization & RLS",
    );
    await expect(page.getByText("Untested").first()).toBeVisible();
    await expect(
      page.getByText("An untested check is not a pass."),
    ).toBeVisible();

    // No evidence, matrix, or comparison exists yet.
    await expect(
      page.getByRole("heading", { name: "RLS coverage matrix" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Before — vulnerable state" }),
    ).toHaveCount(0);

    // The repeated test cannot run before the vulnerable proof.
    await expect(
      page.getByRole("button", {
        name: "Apply remediation and repeat the test",
      }),
    ).toBeDisabled();
  });

  test("the limitation and service boundary are visible without running anything", async ({
    page,
  }) => {
    await page.goto(LAB);
    // The boundary appears beside the proof and again in the footer band; the
    // requirement is that it is present, not that it is present exactly once.
    await expect(page.getByText("Synthetic data only").first()).toBeVisible();
    await expect(
      page.getByText("Not a certification or formal penetration test").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Documented synthetic scope").first(),
    ).toBeVisible();
    await expect(
      page.getByText("What this proves, and what it does not"),
    ).toBeVisible();
  });
});

test.describe("the documented negative test and its remediation", () => {
  test("the vulnerable run reproduces the cross-tenant failure with evidence", async ({
    page,
  }) => {
    await page.goto(LAB);
    await runVulnerable(page);

    // MPS-ACC-003: unauthorized result, affected boundary, plain-language impact.
    await expect(
      page.getByText("Vulnerable — test succeeded unexpectedly").first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cross-tenant data exposure" }),
    ).toBeVisible();
    await expect(page.getByText("High severity")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Read another tenant's member profiles",
      }),
    ).toBeVisible();

    // The recorded rows of another tenant are shown as real, selectable text.
    await expect(page.getByText("Alex Rivera").first()).toBeVisible();
    await expect(
      page
        .getByText(
          "Result: the query returned 2 row(s) it should not have reached",
        )
        .first(),
    ).toBeVisible();

    // Every panel carries its test identifier and its limitation.
    await expect(page.getByText("RLS-001").first()).toBeVisible();
    await expect(page.getByText("Limitation.").first()).toBeVisible();
  });

  test("the repeated test transitions to remediated and keeps allow paths working", async ({
    page,
  }) => {
    await page.goto(LAB);
    await runVulnerable(page);
    await runRemediated(page);

    // MPS-ACC-004: the same documented test, now constrained, with limitation.
    await expect(
      page.getByRole("heading", { name: "After — remediated state" }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("no rows were reachable and nothing was written").first(),
    ).toBeVisible();
    await expect(page.getByText("only the policy set changed")).toBeVisible();

    // The before panel is still present: a remediation never erases the proof.
    await expect(
      page.getByRole("heading", { name: "Before — vulnerable state" }).first(),
    ).toBeVisible();
  });

  test("the storage and configuration scenario proves its own boundary", async ({
    page,
  }) => {
    await page.goto(STORAGE_LAB);
    await runVulnerable(page);

    // MPS-ACC-006: boundary risk, remediation direction, and the data-handling
    // limitation, with no real secret anywhere.
    await expect(
      page.getByRole("heading", {
        name: "Read a private tenant file as an anonymous visitor",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Find exposed tables with row level security switched off",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Remediation direction" }),
    ).toBeVisible();
    await expect(
      page.getByText("It stores metadata only").first(),
    ).toBeVisible();

    await runRemediated(page);
    await expect(
      page.getByText("Remediated — documented test blocked").first(),
    ).toBeVisible();
  });
});

test.describe("reset and recovery", () => {
  test("reset returns the lab to untested and a rerun reproduces the same evidence", async ({
    page,
  }) => {
    await page.goto(LAB);
    await runVulnerable(page);

    const firstOutput = await page.locator("pre").first().innerText();

    await page.getByRole("button", { name: "Reset and retry" }).click();

    await expect(
      page.getByRole("heading", { name: "Before — vulnerable state" }),
    ).toHaveCount(0);
    await expect(
      page.getByText("An untested check is not a pass."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Apply remediation and repeat the test",
      }),
    ).toBeDisabled();

    // Deterministic: the same run produces byte-identical evidence.
    await runVulnerable(page);
    const secondOutput = await page.locator("pre").first().innerText();
    expect(secondOutput).toBe(firstOutput);
  });
});

test.describe("the coverage matrix classifies every check", () => {
  test("all sixteen cells carry a canonical state and a reason", async ({
    page,
  }) => {
    await page.goto(LAB);
    await runVulnerable(page);

    const matrix = page.getByRole("table");
    await expect(matrix).toBeVisible();
    await expect(matrix.getByRole("row")).toHaveCount(5); // header + 4 resources

    // MPS-ACC-005: untested and not-applicable are present and distinct, and
    // no missing check is implied to have passed.
    await page.getByText("Why each check holds its state").click();
    const reasons = page.locator("details ul li");
    await expect(reasons).toHaveCount(16);
    await expect(
      page.getByText("but no documented test in this build covers it").first(),
    ).toBeVisible();
    await expect(
      page.getByText("so no policy is consulted for this operation").first(),
    ).toBeVisible();
  });
});

test.describe("no result is available without evidence, and no route lies", () => {
  test("an unpublished scenario shows untested, not a pass", async ({
    page,
  }) => {
    await page.goto("/scenarios/webhook-integrity");
    await expect(page.getByText("Untested").first()).toBeVisible();
    await expect(page.getByText("Guided lab not published yet")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Run the documented test" }),
    ).toHaveCount(0);
  });

  test("an unapproved scenario identifier does not resolve", async ({
    page,
  }) => {
    for (const slug of [
      "authorization-and-rls-x",
      "..%2F..%2Fetc",
      "public.profiles",
      "vulnerable",
    ]) {
      const response = await page.goto(`/scenarios/${slug}`);
      expect(response?.status(), slug).toBe(404);
    }
  });

  test("no API route exposes the evidence engine", async ({ request }) => {
    for (const path of [
      "/api/evidence",
      "/api/scenarios",
      "/api/rls",
      "/api/query",
    ]) {
      const response = await request.post(path, { data: { sql: "select 1" } });
      expect(response.status(), path).toBe(404);
    }
  });
});

test.describe("accessibility and semantics", () => {
  test("the evidence tabs follow the keyboard tabs pattern", async ({
    page,
  }) => {
    await page.goto(LAB);
    await runVulnerable(page);

    // The context panel's policy excerpt is a single view and renders no
    // tablist, so the first tablist on the page is an evidence panel's.
    const tablist = page.getByRole("tablist").first();
    await expect(tablist.getByRole("tab")).toHaveCount(3);
    const firstTab = tablist.getByRole("tab").first();
    await firstTab.focus();
    await expect(firstTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    const sqlTab = tablist.getByRole("tab", { name: "SQL" });
    await expect(sqlTab).toBeFocused();
    await expect(sqlTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("End");
    await expect(tablist.getByRole("tab").last()).toBeFocused();
  });

  test("a status change is announced without moving focus", async ({
    page,
  }) => {
    await page.goto(LAB);
    const runButton = page.getByRole("button", {
      name: "Run the documented test",
    });
    await runButton.focus();
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("heading", { name: "Before — vulnerable state" }).first(),
    ).toBeVisible();

    const live = page.locator("[aria-live='polite']");
    await expect(live).toContainText("reproduced the boundary failure");
    // Focus stays on the control the buyer activated.
    await expect(
      page.getByRole("button", { name: "Run the vulnerable test again" }),
    ).toBeFocused();
  });

  test("landmarks, headings, and table semantics are present", async ({
    page,
  }) => {
    await page.goto(LAB);
    await runVulnerable(page);

    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Scenario steps" }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Scenario context" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    // Row identity is a header cell, so a screen reader keeps it while scrolling.
    await expect(
      page.getByRole("rowheader", { name: /synthetic\.profiles/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Select" }),
    ).toBeVisible();
  });

  test("primary controls meet the 44px touch target minimum", async ({
    page,
  }) => {
    await page.goto(LAB);
    for (const name of ["Run the documented test", "Reset and retry"]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(box!.height, name).toBeGreaterThanOrEqual(44);
      expect(box!.width, name).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("responsive composition", () => {
  test("the rail becomes an in-flow selector below 960px", async ({
    page,
  }, testInfo) => {
    await page.goto(LAB);
    const width = page.viewportSize()!.width;

    const rail = page.getByRole("navigation", { name: "Scenarios" });
    const selector = page
      .locator("details")
      .filter({ hasText: "Scenario" })
      .first();

    if (width >= 960) {
      await expect(rail).toBeVisible();
    } else {
      await expect(selector).toBeVisible();
      // The selector is keyboard-operable and reveals the four scenarios.
      await selector.locator("summary").click();
      await expect(
        selector.getByRole("link", { name: /Webhook integrity/ }),
      ).toBeVisible();
    }

    expect(testInfo.project.name).toBeTruthy();
  });

  test("evidence state, limitation, and the report route survive every viewport", async ({
    page,
  }) => {
    await page.goto(LAB);
    await runVulnerable(page);

    await expect(
      page.getByText("Vulnerable — test succeeded unexpectedly").first(),
    ).toBeVisible();
    await expect(
      page.getByText("What this proves, and what it does not"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View sample report" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Discuss an authorized review" }).first(),
    ).toBeVisible();

    /*
     * The page body must never scroll horizontally, even with the wide matrix
     * and the code excerpts present. Those scroll inside their own containers.
     *
     * This asserts the behaviour rather than documentElement.scrollWidth:
     * Chromium counts content clipped inside an overflow:hidden container in
     * the root's layout overflow, so that figure reads as overflowing even
     * when the page cannot be scrolled sideways at all.
     */
    const scroll = await page.evaluate(() => {
      window.scrollTo(2000, 0);
      const moved = window.scrollX;
      window.scrollTo(0, 0);
      return {
        moved,
        body: document.body.scrollWidth,
        client: document.documentElement.clientWidth,
      };
    });
    expect(scroll.moved, "the page scrolled horizontally").toBe(0);
    expect(scroll.body).toBeLessThanOrEqual(scroll.client + 1);
  });
});

test.describe("secret safety and prohibited claims", () => {
  test("the rendered lab exposes no credential and makes no prohibited claim", async ({
    page,
  }) => {
    await page.goto(LAB);
    await runVulnerable(page);
    await runRemediated(page);

    const text = await page.locator("body").innerText();

    /*
     * Credential-shaped VALUES, not the words themselves. The page names
     * service-role access and secrets management deliberately, as things this
     * scenario does not cover — MPS-REQ-005 requires saying what was not
     * tested, so a word-level ban here would forbid the honest sentence. The
     * word-level scan runs against the recorded transcript instead, where
     * those words have no legitimate reason to appear.
     */
    for (const pattern of [
      /eyJ[A-Za-z0-9_-]{10,}/,
      /\bsb[ps]_[A-Za-z0-9]{8,}/,
      /postgres(ql)?:\/\//,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /\b(password|secret|api[-_ ]?key|token)\b\s*[:=]\s*\S+/i,
      /\bBearer\s+[A-Za-z0-9._-]{8,}/,
    ]) {
      expect(text, `secret pattern ${pattern}`).not.toMatch(pattern);
    }

    for (const pattern of [
      /\bcertified\b/i,
      /\bcompliant\b/i,
      /\bguaranteed\b/i,
      /\bis secure\b/i,
    ]) {
      expect(text, `prohibited claim ${pattern}`).not.toMatch(pattern);
    }
  });

  test("the lab makes no request to any database or third-party host", async ({
    page,
  }) => {
    const external: string[] = [];
    const consoleErrors: string[] = [];

    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
        external.push(request.url());
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(LAB);
    await runVulnerable(page);
    await runRemediated(page);

    expect(external, "external requests").toEqual([]);
    expect(consoleErrors, "console errors").toEqual([]);
  });
});

test.describe("measured contrast in the run state", () => {
  test("every evidence surface meets AA text contrast once the tests have run", async ({
    page,
  }) => {
    /*
     * The static routes are covered by the S1 suite. This measures what only
     * exists after a run: the tinted vulnerable and remediated status blocks,
     * the dark code surface and its caption, the finding band, the matrix
     * cells and legend, and the limitation callout.
     */
    await page.goto(LAB);
    await runVulnerable(page);
    await runRemediated(page);
    await page.getByText("Why each check holds its state").click();

    expect(
      await measureContrastFailures(page),
      "text below the AA contrast threshold",
    ).toEqual([]);
  });
});
