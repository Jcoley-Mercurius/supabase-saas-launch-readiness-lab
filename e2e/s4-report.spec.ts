import { expect, test, type Page } from "@playwright/test";
import { measureContrastFailures } from "./contrast";

/*
 * S4 browser verification — the severity-ranked report and case study.
 *
 * Trace: MPS-REQ-008/009/013/014, MPS-RULE-002/003/005/007,
 *        MPS-ACC-009/010/014/015;
 *        MDS COMPOSITION-PROPOSAL "Audit report shell", DESIGN-SYSTEM.md §13;
 *        MDS-REF-007, MDS-REF-002 (landing snapshot and report preview);
 *        MTS qa/MTS-QA.md.
 */

const REPORT = "/report";

/** The four approved areas, in the order the derivation ranks them. */
const AREAS = [
  "Authorization & RLS",
  "Storage & configuration",
  "Webhook integrity",
  "Reliability & recovery",
];

/** The eight approved report sections (MDS COMPOSITION-PROPOSAL). */
const SECTIONS = [
  "executive-summary",
  "severity-overview",
  "findings",
  "coverage-matrix",
  "webhook-recovery",
  "remediation",
  "method-limitations",
  "case-study",
];

async function openReport(page: Page) {
  await page.goto(REPORT);
  await expect(
    page.getByRole("heading", { level: 1, name: /Launch-Readiness Review/i }),
  ).toBeVisible();
}

test.describe("the report is reachable and complete without interaction", () => {
  test("every approved section renders, in order", async ({ page }) => {
    await openReport(page);

    for (const id of SECTIONS) {
      await expect(page.locator(`section#${id}`)).toBeVisible();
    }

    // Order is part of the approved shell, not just presence.
    const ids = await page
      .locator("section[id]")
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(ids.filter((id) => SECTIONS.includes(id))).toEqual(SECTIONS);
  });

  test("every finding is expanded, with no control able to hide one", async ({
    page,
  }) => {
    await openReport(page);

    for (const area of AREAS) {
      const heading = page.getByRole("heading", {
        name: new RegExp(`Finding \\d+ · ${area.replace("&", "&")}`),
      });
      await expect(heading).toBeVisible();
    }

    // The approved shell must read without interaction: no filter, no collapse.
    await expect(page.getByRole("tab", { name: /^All \(/ })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /collapse all/i }),
    ).toHaveCount(0);
  });

  test("no finding reaches the reader without its seven required parts", async ({
    page,
  }) => {
    await openReport(page);

    // MPS-REQ-008 / MPS-ACC-009, checked on the rendered page rather than the
    // model: severity, affected boundary, reproduction, impact, remediation,
    // before/after status, limitation.
    await expect(page.getByText(/severity$/i).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Reproduction evidence" }),
    ).toHaveCount(AREAS.length);
    await expect(
      page.getByRole("heading", { name: "Remediation direction" }),
    ).toHaveCount(AREAS.length);
    await expect(
      page.getByRole("heading", { name: "As found", exact: true }),
    ).toHaveCount(AREAS.length);
    await expect(
      page.getByRole("heading", { name: "After the documented fix" }),
    ).toHaveCount(AREAS.length);
    await expect(page.getByText("Scope and limitation")).toHaveCount(
      AREAS.length,
    );
  });

  test("the authorized-review CTA is reachable without completing a scenario", async ({
    page,
  }) => {
    // MPS-ACC-010: opened directly, no scenario run, no account.
    await openReport(page);
    const cta = page
      .getByRole("link", { name: "Discuss an authorized review" })
      .first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/inquiry");
  });
});

test.describe("the report states only what the evidence supports", () => {
  test("prohibited vocabulary never appears", async ({ page }) => {
    await openReport(page);
    const text = (await page.locator("body").innerText()).toLowerCase();

    for (const word of [
      "certified",
      "compliant",
      "guaranteed",
      "launch-ready",
    ]) {
      expect(text, `"${word}" must not appear`).not.toContain(word);
    }
    // "passed" is prohibited unqualified; the canonical labels never use it.
    expect(text).not.toMatch(/\bpassed\b/);
  });

  test("the untested and not-applicable states are stated, never implied away", async ({
    page,
  }) => {
    await openReport(page);
    await expect(
      page.getByText("Untested operations in the matrix"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Operations with no recorded result" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What was not tested", exact: true }),
    ).toBeVisible();
  });

  test("the sample and synthetic framing precedes any finding", async ({
    page,
  }) => {
    await openReport(page);
    const framing = page.getByText(
      "This is a sample report built on synthetic data",
    );
    await expect(framing).toBeVisible();

    const framingY = (await framing.boundingBox())?.y ?? 0;
    const firstFindingY =
      (await page.locator("#findings").boundingBox())?.y ?? 0;
    expect(framingY).toBeLessThan(firstFindingY);
  });

  test("the evidence provenance is published with the report", async ({
    page,
  }) => {
    await openReport(page);
    await expect(
      page.getByRole("heading", { name: "Evidence provenance" }),
    ).toBeVisible();
    await expect(page.getByText(/^sha256:/)).toBeVisible();
  });
});

test.describe("print", () => {
  /*
   * The approved report shell must "remain printable/readable without
   * interactive controls or dark-page backgrounds". That is checked in the
   * print medium itself rather than inferred from the stylesheet.
   */
  test("no dark page background survives to print", async ({ page }) => {
    await openReport(page);
    await page.emulateMedia({ media: "print" });

    const dark = await page.evaluate(() => {
      const luminance = (value: string) => {
        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return 1;
        const [r, g, b, a = 1] = match[1]
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number);
        if (a === 0) return 1;
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      };

      return [...document.querySelectorAll("section, header, footer, figure")]
        .filter((node) => {
          const style = getComputedStyle(node);
          if (style.display === "none") return false;
          return luminance(style.backgroundColor) < 0.35;
        })
        .map((node) => `${node.tagName}.${node.className}`.slice(0, 120));
    });

    expect(dark, `dark surfaces still print: ${dark.join(" | ")}`).toEqual([]);
  });

  test("no evidence is clipped or collapsed away on paper", async ({
    page,
  }) => {
    await openReport(page);
    await page.emulateMedia({ media: "print" });

    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll("*")]
        .filter((node) => {
          const style = getComputedStyle(node);
          if (style.display === "none") return false;
          const scrolls = style.overflow !== "visible" && style.overflow !== "";
          const capped = style.maxHeight !== "none";
          return scrolls || capped;
        })
        .map((node) => `${node.tagName}.${node.className}`.slice(0, 120)),
    );

    expect(
      clipped,
      `these still clip in print: ${clipped.join(" | ")}`,
    ).toEqual([]);
  });

  test("screen controls that cannot work on paper are removed", async ({
    page,
  }) => {
    await openReport(page);
    await page.emulateMedia({ media: "print" });

    // The section index is anchor navigation, which paper cannot follow.
    await expect(
      page.getByRole("navigation", { name: "Report sections" }),
    ).toBeHidden();

    // Every finding, its evidence, and its limitation still print.
    await expect(
      page.getByRole("heading", { name: "Reproduction evidence" }),
    ).toHaveCount(AREAS.length);
    await expect(page.getByText("Scope and limitation")).toHaveCount(
      AREAS.length,
    );
  });
});

test.describe("responsive composition", () => {
  test("the section index is present at every width and hides nothing", async ({
    page,
  }, testInfo) => {
    await openReport(page);
    const index = page.getByRole("navigation", { name: "Report sections" });
    await expect(index).toBeVisible();

    // Below desktop it becomes an in-flow table of contents rather than a
    // sticky rail; at desktop and above it is sticky beside the report.
    const position = await index.evaluate(
      (node) => getComputedStyle(node).position,
    );
    const width = testInfo.project.use.viewport?.width ?? 1200;
    expect(position).toBe(width >= 960 ? "sticky" : "static");

    // Nothing is dropped for viewport size.
    for (const id of SECTIONS) {
      await expect(page.locator(`section#${id}`)).toBeVisible();
    }
  });

  test("the page never scrolls horizontally", async ({ page }) => {
    await openReport(page);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("accessibility", () => {
  test("headings are ordered and landmarks are named", async ({ page }) => {
    await openReport(page);

    const levels = await page
      .locator("h1, h2, h3, h4")
      .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName[1])));

    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(
        levels[i] - levels[i - 1],
        `heading level jumped from h${levels[i - 1]} to h${levels[i]}`,
      ).toBeLessThanOrEqual(1);
    }

    await expect(page.locator("main")).toHaveCount(1);
  });

  test("every table is captioned and every section is labelled", async ({
    page,
  }) => {
    await openReport(page);

    const tables = page.locator("table");
    const count = await tables.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(tables.nth(i).locator("caption")).toHaveCount(1);
    }
  });

  test("text meets AA contrast", async ({ page }) => {
    await openReport(page);
    const failures = await measureContrastFailures(page);
    expect(failures, failures.join("\n")).toEqual([]);
  });

  test("the whole report is reachable by keyboard", async ({ page }) => {
    await openReport(page);

    // The section index is the report's own navigation; each entry must be
    // focusable and must move to a real target.
    const first = page
      .getByRole("navigation", { name: "Report sections" })
      .getByRole("link")
      .first();
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#executive-summary$/);
  });
});

test.describe("the landing page shows the same evidence as the report", () => {
  test("the hero snapshot and report preview are populated from recorded data", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Evidence snapshot (synthetic data)" }),
    ).toBeVisible();
    await expect(page.getByText(/^Recorded /).first()).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Clear findings, easy to act on" }),
    ).toBeVisible();

    // The preview links into the report at the matching finding.
    const link = page
      .getByRole("link", { name: "Cross-tenant data exposure" })
      .first();
    await expect(link).toHaveAttribute(
      "href",
      "/report#finding-authorization-and-rls",
    );
  });

  test("landing counts match the report's counts", async ({ page }) => {
    await page.goto("/");
    const heroUnmet = await page
      .locator("li", { hasText: "Checks unmet as found" })
      .first()
      .innerText();

    await page.goto(REPORT);
    const reportUnmet = await page
      .locator("li", { hasText: "Checks unmet as found" })
      .first()
      .innerText();

    const number = (text: string) => text.match(/\d+/)?.[0];
    expect(number(heroUnmet)).toBe(number(reportUnmet));
  });
});
