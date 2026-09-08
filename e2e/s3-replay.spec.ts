import { expect, test, type Page } from "@playwright/test";
import { measureContrastFailures } from "./contrast";

/*
 * S3 browser verification — webhook replay, idempotency, failure and recovery.
 *
 * Trace: MPS-REQ-006/007/012/013, MPS-RULE-001/002/004/007,
 *        MPS-ACC-007/008/014/015;
 *        MDS DESIGN-SYSTEM.md §9-12; MDS-REF-006, MDS-REF-009 panel 3;
 *        MTS qa/MTS-QA.md.
 */

const WEBHOOK = "/scenarios/webhook-integrity";
const RELIABILITY = "/scenarios/reliability-and-recovery";

/*
 * Both scenarios publish four documented sequences, and each renders a
 * before/after pair. Waiting for the LAST pair rather than the first matters:
 * a remediated run re-renders eight code excerpts and eight ledger tables, and
 * an assertion that fires after the first heading appears can outrun the rest
 * of that render and fail on text that is about to exist. Waiting on the count
 * settles the page before anything is asserted against it.
 */
const SEQUENCES_PER_SCENARIO = 4;

async function runVulnerable(page: Page) {
  await page
    .getByRole("button", { name: "Replay the documented sequences" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Before — vulnerable handler" }),
  ).toHaveCount(SEQUENCES_PER_SCENARIO, { timeout: 30_000 });
}

async function runRemediated(page: Page) {
  await page
    .getByRole("button", { name: "Apply the remediated handler and repeat" })
    .click();
  /*
   * Deliberately NOT the "After — remediated handler" heading: that column
   * heading is rendered by the comparison as soon as the vulnerable run
   * exists, above the untested placeholder, so waiting on it returns
   * immediately and lets assertions race the remediated render. The
   * placeholder itself is the only thing that is true before the repeated run
   * and false after it, for every pair.
   */
  await expect(
    page.getByText(
      "The remediated handler configuration has not been applied in this session.",
    ),
  ).toHaveCount(0, { timeout: 30_000 });
}

test.describe("the lab starts untested and never implies a pass", () => {
  test("no result is shown before a documented sequence is replayed", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Webhook integrity",
    );
    await expect(page.getByText("Untested").first()).toBeVisible();
    await expect(
      page.getByText("An untested check is not a pass."),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Before — vulnerable handler" }),
    ).toHaveCount(0);

    // The repeated run cannot happen before the vulnerable proof.
    await expect(
      page.getByRole("button", {
        name: "Apply the remediated handler and repeat",
      }),
    ).toBeDisabled();
  });

  test("the limitation and service boundary are visible without running anything", async ({
    page,
  }) => {
    await page.goto(RELIABILITY);
    await expect(page.getByText("Synthetic data only").first()).toBeVisible();
    await expect(
      page.getByText("Not a certification or formal penetration test").first(),
    ).toBeVisible();
    await expect(
      page.getByText("What this proves, and what it does not"),
    ).toBeVisible();
    // The synthetic signing material is disclosed before any result is shown,
    // not after.
    await expect(
      page.getByText("deterministic injected faults").first(),
    ).toBeVisible();
  });
});

test.describe("duplicate delivery and idempotency (MPS-ACC-007)", () => {
  test("the vulnerable handler commits the same logical event twice", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    await runVulnerable(page);

    await expect(
      page.getByText("Vulnerable — test succeeded unexpectedly").first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Duplicate and forged event processing",
      }),
    ).toBeVisible();
    await expect(page.getByText("High severity")).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "The same logical event is delivered twice",
      }),
    ).toBeVisible();
    await expect(page.getByText("WHK-001").first()).toBeVisible();

    // The duplicate commitment is stated as a count, not as an impression.
    await expect(
      page.getByText("the same work was committed more than once").first(),
    ).toBeVisible();
    await expect(page.getByText("Limitation.").first()).toBeVisible();
  });

  test("the remediated handler commits it exactly once and keeps the legitimate path working", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    await runVulnerable(page);
    await runRemediated(page);

    await expect(
      page.getByText("Remediated — documented test blocked").first(),
    ).toBeVisible();

    // MPS-ACC-007: the same logical event does not create a duplicate
    // commitment once the handler is remediated.
    await expect(
      page
        .getByText("acknowledged without committing anything a second time")
        .first(),
    ).toBeVisible();
    await expect(
      page.getByText("only the handler configuration changed"),
    ).toBeVisible();

    // The before evidence is still present: a remediation never erases the proof.
    await expect(
      page
        .getByRole("heading", { name: "Before — vulnerable handler" })
        .first(),
    ).toBeVisible();
  });

  test("a forged event and a superseded event are both refused after remediation", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    await runVulnerable(page);
    await runRemediated(page);

    await expect(
      page.getByRole("heading", {
        name: "A forged event with a signature that does not verify",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Rejected — signature did not verify").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Rejected — superseded event").first(),
    ).toBeVisible();
  });
});

test.describe("failure, retry and recovery (MPS-ACC-008)", () => {
  test("the vulnerable handler loses the event and discards the retry", async ({
    page,
  }) => {
    await page.goto(RELIABILITY);
    await runVulnerable(page);

    await expect(
      page.getByRole("heading", {
        name: "Silent event loss during a downstream failure",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Failed after being marked processed").first(),
    ).toBeVisible();
    await expect(
      page.getByText("the work was lost rather than duplicated").first(),
    ).toBeVisible();
  });

  test("the remediated handler recovers, and the final state and limitation are visible", async ({
    page,
  }) => {
    await page.goto(RELIABILITY);
    await runVulnerable(page);
    await runRemediated(page);

    // The failure rolls back rather than being swallowed, and the retry commits.
    await expect(
      page.getByText("Failed and rolled back").first(),
    ).toBeVisible();
    await expect(
      page.getByText("remains eligible for the provider's retry").first(),
    ).toBeVisible();

    // MPS-ACC-008: the final state after recovery is visible...
    await expect(
      page.getByText("reached the required end state").first(),
    ).toBeVisible();
    // ...with the recovery limitation adjacent to it...
    await expect(
      page.getByText("does not model network partitions").first(),
    ).toBeVisible();
    // ...and the buyer can return to the scenario index.
    await expect(
      page.getByRole("link", { name: "Back to all scenarios" }),
    ).toBeVisible();
  });

  test("a multi-attempt outage and a post-recovery replay are both covered", async ({
    page,
  }) => {
    await page.goto(RELIABILITY);
    await runVulnerable(page);
    await runRemediated(page);

    await expect(
      page.getByRole("heading", {
        name: "A sustained outage across three attempts, then recovery",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Recovery followed by a manual replay must not double-apply",
      }),
    ).toBeVisible();
  });
});

test.describe("the delivery ledger classifies every step", () => {
  test("each delivery carries its decision, its resulting state, and its checkpoint", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    await runVulnerable(page);

    await page
      .getByText("Delivery-by-delivery ledger for WHK-001")
      .first()
      .click();

    const ledger = page.getByRole("table").first();
    await expect(ledger).toBeVisible();
    // Header plus the two deliveries of WHK-001.
    await expect(ledger.getByRole("row")).toHaveCount(3);
    await expect(
      ledger.getByRole("columnheader", { name: "Handler decision" }),
    ).toBeVisible();
    await expect(
      ledger.getByRole("columnheader", { name: "Commitments after" }),
    ).toBeVisible();

    // A checkpoint that did not hold says so in words, not only in colour.
    await expect(page.getByText("did not hold").first()).toBeVisible();
  });
});

test.describe("reset and determinism", () => {
  test("reset returns the lab to untested and a rerun reproduces the same evidence", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    await runVulnerable(page);

    const firstOutput = await page.locator("pre").first().innerText();

    await page.getByRole("button", { name: "Reset and retry" }).click();

    await expect(
      page.getByRole("heading", { name: "Before — vulnerable handler" }),
    ).toHaveCount(0);
    await expect(
      page.getByText("An untested check is not a pass."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Apply the remediated handler and repeat",
      }),
    ).toBeDisabled();

    await runVulnerable(page);
    const secondOutput = await page.locator("pre").first().innerText();
    expect(secondOutput).toBe(firstOutput);
  });
});

test.describe("no endpoint, no result without evidence", () => {
  test("no webhook or event route is published", async ({ request }) => {
    /*
     * The scenario is ABOUT a webhook endpoint, so the most important thing
     * this slice can prove in the browser is that it did not build one.
     */
    for (const path of [
      "/api/webhook",
      "/api/webhooks",
      "/api/events",
      "/api/replay",
      "/webhook",
      "/webhooks",
      "/api/stripe",
    ]) {
      const response = await request.post(path, {
        data: { id: "evt_1", type: "invoice.paid" },
        headers: { "x-signature": "abc" },
      });
      expect(response.status(), path).toBe(404);
    }
  });

  test("an unapproved scenario identifier does not resolve", async ({
    page,
  }) => {
    for (const slug of [
      "webhook-integrity-x",
      "reliability",
      "del_nw2041_a",
      "evt_nw2041_paid",
    ]) {
      const response = await page.goto(`/scenarios/${slug}`);
      expect(response?.status(), slug).toBe(404);
    }
  });
});

test.describe("accessibility and semantics", () => {
  test("the evidence tabs follow the keyboard tabs pattern", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    await runVulnerable(page);

    // The context panel's configuration excerpt is a single view and renders
    // no tablist, so the first tablist on the page is an evidence panel's.
    const tablist = page.getByRole("tablist").first();
    await expect(tablist.getByRole("tab")).toHaveCount(4);
    const firstTab = tablist.getByRole("tab").first();
    await firstTab.focus();
    await expect(firstTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    const configTab = tablist.getByRole("tab", {
      name: "Handler configuration",
    });
    await expect(configTab).toBeFocused();
    await expect(configTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("End");
    await expect(tablist.getByRole("tab").last()).toBeFocused();
  });

  test("a status change is announced without moving focus", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    const runButton = page.getByRole("button", {
      name: "Replay the documented sequences",
    });
    await runButton.focus();
    await page.keyboard.press("Enter");

    await expect(
      page
        .getByRole("heading", { name: "Before — vulnerable handler" })
        .first(),
    ).toBeVisible();

    const live = page.locator("[aria-live='polite']");
    await expect(live).toContainText("did not reach the required end state");
    // Focus stays on the control the buyer activated.
    await expect(
      page.getByRole("button", {
        name: "Replay the vulnerable sequences again",
      }),
    ).toBeFocused();
  });

  test("landmarks, headings, and table semantics are present", async ({
    page,
  }) => {
    await page.goto(RELIABILITY);
    await runVulnerable(page);
    await page
      .getByText("Delivery-by-delivery ledger for REL-001")
      .first()
      .click();

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
      page.getByRole("rowheader", { name: /Attempt 1/ }).first(),
    ).toBeVisible();
  });

  test("primary controls meet the 44px touch target minimum", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    for (const name of ["Replay the documented sequences", "Reset and retry"]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(box!.height, name).toBeGreaterThanOrEqual(44);
      expect(box!.width, name).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("responsive composition", () => {
  test("evidence state, limitation, and the report route survive every viewport", async ({
    page,
  }) => {
    await page.goto(RELIABILITY);
    await runVulnerable(page);
    await runRemediated(page);

    await expect(
      page.getByText("Remediated — documented test blocked").first(),
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
     * The page body must never scroll horizontally, even with the wide ledger
     * tables and the code excerpts present. Those scroll inside their own
     * containers. Asserted as behaviour rather than documentElement
     * .scrollWidth, for the reason recorded in the S2 suite.
     */
    await page
      .getByText("Delivery-by-delivery ledger for REL-002")
      .first()
      .click();

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
  test("the rendered lab exposes no credential, signature, or prohibited claim", async ({
    page,
  }) => {
    await page.goto(WEBHOOK);
    await runVulnerable(page);
    await runRemediated(page);

    const text = await page.locator("body").innerText();

    for (const pattern of [
      /eyJ[A-Za-z0-9_-]{10,}/,
      /\bsb[ps]_[A-Za-z0-9]{8,}/,
      /postgres(ql)?:\/\//,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /\b(password|secret|api[-_ ]?key|token)\b\s*[:=]\s*\S+/i,
      /\bBearer\s+[A-Za-z0-9._-]{8,}/,
      // The fixture's own invented signing string, and any digest-shaped run
      // of hex (md5- or sha256-length): the page states whether a signature
      // verified, never the value.
      /synthetic-signing-material/,
      /\b[0-9a-f]{32,}\b/,
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

  test("the lab makes no request to any database, provider, or third-party host", async ({
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

    await page.goto(RELIABILITY);
    await runVulnerable(page);
    await runRemediated(page);

    expect(external, "external requests").toEqual([]);
    expect(consoleErrors, "console errors").toEqual([]);
  });
});

test.describe("measured contrast in the run state", () => {
  test("every replay evidence surface meets AA text contrast once the sequences have run", async ({
    page,
  }) => {
    /*
     * This measures what only exists after a replay run: the tinted status
     * blocks, the dark log surface and its caption, the finding band, and the
     * ledger's checkpoint text, which is the one place this slice introduces a
     * new semantic colour pairing.
     */
    await page.goto(WEBHOOK);
    await runVulnerable(page);
    await runRemediated(page);
    await page
      .getByText("Delivery-by-delivery ledger for WHK-001")
      .first()
      .click();

    expect(
      await measureContrastFailures(page),
      "text below the AA contrast threshold",
    ).toEqual([]);
  });
});
