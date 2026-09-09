import { expect, test, type Page } from "@playwright/test";
import { measureContrastFailures } from "./contrast";

/**
 * S1 — public MDS shell and scenario navigation.
 *
 * Verifies the slice against the approved authority rather than against its own
 * implementation: navigation integrity (MPS-REQ-009, MPS-ACC-010), the honest
 * untested evidence state (MPS-RULE-002, MPS-ACC-005), the service boundary
 * (MPS-REQ-001, MPS-REQ-014), the approved responsive transformations
 * (MDS responsive.rules), and WCAG 2.2 AA keyboard, focus, landmark, and touch
 * requirements.
 */

const PUBLIC_ROUTES = [
  "/",
  "/scenarios",
  "/scenarios/authorization-and-rls",
  "/method",
  "/about",
  "/report",
  "/inquiry",
] as const;

/** Claim vocabulary the approved MDS prohibits outright. */
const PROHIBITED_CLAIMS = [
  /\bsecure\b/i,
  /\bcertified\b/i,
  /\bcompliant\b/i,
  /\bguaranteed\b/i,
];

type PageProblems = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
};

function watchForProblems(page: Page): PageProblems {
  const problems: PageProblems = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") problems.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => problems.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    problems.failedRequests.push(
      `${request.url()} — ${request.failure()?.errorText ?? "unknown"}`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      problems.failedRequests.push(`${response.url()} — ${response.status()}`);
    }
  });

  return problems;
}

test.describe("runtime and asset health", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} loads with no console, script, or asset failure`, async ({
      page,
    }) => {
      const problems = watchForProblems(page);
      const response = await page.goto(route);

      expect(response?.ok(), `${route} should serve successfully`).toBe(true);
      await expect(page.locator("main")).toBeVisible();

      expect(problems.pageErrors, "uncaught script errors").toEqual([]);
      expect(problems.consoleErrors, "console errors").toEqual([]);
      expect(problems.failedRequests, "failed requests and assets").toEqual([]);
    });
  }
});

test.describe("approved page semantics", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} exposes landmarks and a single H1`, async ({ page }) => {
      await page.goto(route);

      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
    });

    test(`${route} uses no prohibited claim vocabulary`, async ({ page }) => {
      await page.goto(route);
      const text = (await page.locator("body").innerText()).replace(
        /\s+/g,
        " ",
      );

      for (const claim of PROHIBITED_CLAIMS) {
        expect(text, `${route} must not claim ${claim}`).not.toMatch(claim);
      }
    });
  }
});

test.describe("navigation integrity", () => {
  test("the report and the authorized-review CTA are reachable from every route", async ({
    page,
    isMobile,
    viewport,
  }) => {
    const collapsed = (viewport?.width ?? 0) < 960 || isMobile;

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);

      if (collapsed) {
        // Below desktop the links live in the disclosure menu, which must open
        // from the keyboard and must present the CTA and the report route.
        const toggle = page.getByRole("button", { name: /open main menu/i });
        await expect(toggle).toBeVisible();
        await toggle.click();
        await expect(
          page
            .getByRole("navigation", { name: "Primary" })
            .getByRole("link", { name: /discuss an authorized review/i }),
        ).toBeVisible();
        await expect(
          page
            .getByRole("navigation", { name: "Primary" })
            .getByRole("link", { name: "Sample report", exact: true }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(toggle).toBeFocused();
      } else {
        await expect(
          page
            .getByRole("banner")
            .getByRole("link", { name: /discuss an authorized review/i }),
        ).toBeVisible();
        await expect(
          page.getByRole("banner").getByRole("link", { name: "Sample report" }),
        ).toBeVisible();
      }

      // The approved authorized-review band closes every public route except
      // the inquiry route itself, which is the CTA's destination. So the CTA is
      // never hidden purely because of viewport size.
      if (route !== "/inquiry") {
        await expect(
          page
            .getByRole("main")
            .getByRole("link", { name: /discuss an authorized review/i })
            .first(),
        ).toBeVisible();
      }
    }
  });

  test("the sample report is reachable without completing a scenario", async ({
    page,
  }) => {
    await page.goto("/scenarios");
    await page
      .getByRole("link", { name: /view sample report/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/report$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("a scenario keeps its breadcrumb back path", async ({ page }) => {
    await page.goto("/scenarios/authorization-and-rls");
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toBeVisible();
    await breadcrumb.getByRole("link", { name: "Scenarios" }).click();
    await expect(page).toHaveURL(/\/scenarios$/);
  });
});

test.describe("evidence-state honesty", () => {
  test("every scenario card publishes the untested state with an explanation", async ({
    page,
  }) => {
    await page.goto("/scenarios");

    const untested = page.getByText("Untested", { exact: true });
    await expect(untested).toHaveCount(4);
    await expect(
      page.getByText("No documented test has been run in this session."),
    ).toHaveCount(4);
  });

  test("exploration progress is not presented as security coverage", async ({
    page,
  }) => {
    await page.goto("/scenarios");
    await expect(page.getByText("0 of 4 explored")).toBeVisible();
    await expect(
      page.getByText(
        "Evidence explored in this session. Not a measure of overall security.",
      ),
    ).toBeVisible();
  });

  test("the service boundary is stated on the entry routes", async ({
    page,
  }) => {
    for (const route of ["/", "/scenarios"]) {
      await page.goto(route);
      await expect(page.getByText("Synthetic data only").first()).toBeVisible();
      await expect(
        page
          .getByText("Not a certification or formal penetration test")
          .first(),
      ).toBeVisible();
    }
  });
});

test.describe("colour contrast", () => {
  // WCAG 2.2 AA 1.4.3. The measurement lives in ./contrast so S2 can reuse it.
  for (const route of PUBLIC_ROUTES) {
    test(`${route} meets AA text contrast`, async ({ page }) => {
      await page.goto(route);

      const failures = await measureContrastFailures(page);

      expect(failures, "text below the AA contrast threshold").toEqual([]);
    });
  }
});

test.describe("keyboard and focus", () => {
  test("the skip link is the first stop and moves to main content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
  });

  test("focused controls render a visible focus indicator", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const outline = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element) return null;
      const style = window.getComputedStyle(element);
      return {
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
      };
    });

    expect(outline?.style).not.toBe("none");
    expect(outline?.width ?? 0).toBeGreaterThanOrEqual(2);
  });

  test("the whole entry path is reachable by keyboard alone", async ({
    page,
  }) => {
    await page.goto("/");

    const reached = new Set<string>();
    for (let step = 0; step < 60; step += 1) {
      await page.keyboard.press("Tab");
      const href = await page.evaluate(() =>
        document.activeElement instanceof HTMLAnchorElement
          ? new URL(document.activeElement.href).pathname
          : null,
      );
      if (href) reached.add(href);
    }

    expect(reached).toContain("/scenarios");
    expect(reached).toContain("/report");
    expect(reached).toContain("/inquiry");
    expect(reached).toContain("/method");
    expect(reached).toContain("/about");
  });
});

test.describe("responsive composition", () => {
  test("scenario cards follow the approved 1 / 2 / 4-up transformation", async ({
    page,
  }) => {
    await page.goto("/scenarios");

    /*
     * Settle the first paint before measuring anything.
     *
     * On a cold load the four cards briefly share a top while the webfonts and
     * the content above them are still resolving, which reads as 4-up at every
     * width. Waiting for the cards to be present and the network to go quiet
     * puts the first measurement after that, not inside it.
     */
    const cards = page.locator("li a[href^='/scenarios/']");
    await expect(cards.first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    /** Cards sharing the topmost row are the column count for that width. */
    async function measureColumns() {
      const tops = await cards.evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
      );
      const first = Math.min(...tops);
      return tops.filter((top) => Math.abs(top - first) <= 2).length;
    }

    /*
     * Resize, then poll the measurement until the new composition settles.
     *
     * `window.innerWidth` reports the new width before the grid has finished
     * reflowing to it, so a single measurement taken straight after the resize
     * can still read the previous width's row — the largest starting viewport
     * measured 4-up at 390px that way. A fixed settle delay only makes that
     * window smaller; polling closes it, and a genuinely wrong count still
     * fails, just after the retries are exhausted.
     */
    async function expectColumns(
      width: number,
      expected: number,
      message: string,
    ) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(
        (target) => window.innerWidth === target,
        width,
      );
      await expect
        .poll(measureColumns, { message, timeout: 10_000 })
        .toBe(expected);
    }

    await expectColumns(390, 1, "mobile is 1-up");
    await expectColumns(768, 2, "tablet is 2-up");
    await expectColumns(1000, 2, "desktop is 2-up");
    await expectColumns(1440, 4, "wide is 4-up");
  });

  test("no route scrolls horizontally at any approved width", async ({
    page,
  }) => {
    /*
     * Seven widths across every public route is 40-plus navigations in one
     * test, and each one waits on document.fonts.ready. Measured isolated it
     * takes 29-44s against the default 60s budget, and in a five-project run
     * at four workers it exceeded the budget and failed as a timeout - with no
     * overflow assertion ever reached, so the failure said nothing about
     * layout. test.slow() triples the budget rather than thinning the matrix,
     * because the widths are the point of the test (MTS-OBS-018).
     */
    test.slow();

    for (const width of [320, 390, 640, 768, 960, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of PUBLIC_ROUTES) {
        await page.goto(route);
        /*
         * Wait for the webfonts before measuring. A font swap changes text
         * width, so measuring mid-swap is a genuine race, not a slow machine:
         * under a loaded five-project run this reported overflow that does not
         * exist once Geist has applied.
         */
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("primary actions meet the 44px touch-target minimum", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/scenarios");

    // Scoped to the application's own landmarks. The approved 44px minimum
    // governs product controls, so the selector must not be able to reach
    // outside them — an injected overlay control failed this assertion once
    // already, for a reason that had nothing to do with the approved layout.
    // MTS-DEC-011 removed that particular overlay by serving production
    // everywhere; the scoping stays because the assertion should not depend on
    // nothing ever being injected again. See MTS-OBS-027.
    const targets = page
      .locator("header, main, footer")
      .locator(
        "a[href='/inquiry'], a[href^='/scenarios/'], button[aria-controls]",
      );
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await targets.nth(index).boundingBox();
      if (!box) continue;
      expect(box.height, `target ${index} height`).toBeGreaterThanOrEqual(44);
      expect(box.width, `target ${index} width`).toBeGreaterThanOrEqual(44);
    }
  });

  test("body text never drops below the approved 16px reading minimum", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const size = await page.evaluate(() =>
      parseFloat(window.getComputedStyle(document.body).fontSize),
    );
    expect(size).toBeGreaterThanOrEqual(16);
  });
});
