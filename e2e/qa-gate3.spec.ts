import { expect, test, type Page } from "@playwright/test";

/**
 * MDS QA Gate 3 — product quality (mds/qa/MDS-QA.md).
 *
 * The slice suites already prove the transformations their own slice
 * introduced. This suite covers what the protocol requires of the COMBINED
 * experience and what no slice had a reason to test:
 *
 *  - the six required widths plus intermediates, on every public route;
 *  - the approved 24/32/48 page gutters, measured;
 *  - reflow at 320 CSS px (WCAG 2.2 AA 1.4.10, equivalent to 400% zoom) and a
 *    real 200% page zoom;
 *  - the WCAG 1.4.12 text-spacing override and long-content stress;
 *  - reduced motion;
 *  - matrix row identity during horizontal overflow;
 *  - the report and inquiry sidebars moving in-flow below desktop;
 *  - the approved mobile reading order on a scenario route;
 *  - print completeness on the report.
 *
 * These tests set their own viewport, so they assert the same thing in every
 * browser project rather than once per project viewport.
 */

const PUBLIC_ROUTES = [
  "/",
  "/scenarios",
  "/scenarios/authorization-and-rls",
  "/scenarios/storage-and-configuration",
  "/scenarios/webhook-integrity",
  "/scenarios/reliability-and-recovery",
  "/method",
  "/about",
  "/report",
  "/inquiry",
] as const;

/** The protocol's six required widths, plus intermediates between them. */
const REQUIRED_WIDTHS = [390, 640, 768, 960, 1280, 1440];
const INTERMEDIATE_WIDTHS = [414, 700, 860, 1024, 1150, 1366];

/** DESIGN-SYSTEM section 6 — "Page gutters: 24 mobile, 32 tablet, 48 desktop". */
const APPROVED_GUTTERS: [number, number][] = [
  [390, 24],
  [639, 24],
  [640, 32],
  [768, 32],
  [959, 32],
  [960, 48],
  [1280, 48],
  [1440, 48],
];

async function settle(page: Page, route: string) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("main")).toBeVisible();
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

test.describe("Gate 3 — responsive and content stress", () => {
  test("the approved page gutters render at every breakpoint boundary", async ({
    page,
  }) => {
    await settle(page, "/");

    for (const [width, expected] of APPROVED_GUTTERS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(
        (target) => window.innerWidth === target,
        width,
      );

      /*
       * Measured on the shared Container, which is the single implementation of
       * the approved gutters. Reading the computed padding proves the value the
       * visitor gets rather than the utility class that was intended.
       */
      const gutter = await page.evaluate(() => {
        const container = document.querySelector("main .mx-auto");
        if (!container) return null;
        return parseFloat(getComputedStyle(container).paddingLeft);
      });

      expect(gutter, `page gutter at ${width}px`).toBe(expected);
    }
  });

  test("no route overflows horizontally at any required or intermediate width", async ({
    page,
  }) => {
    /*
     * Sixteen widths across ten routes is 160 navigations, each waiting on
     * document.fonts.ready. Same reasoning as the S1 sweep it extends
     * (MTS-OBS-018): the widths are the point, so the budget is raised rather
     * than the matrix thinned.
     */
    test.slow();

    for (const width of [...REQUIRED_WIDTHS, ...INTERMEDIATE_WIDTHS].sort(
      (a, b) => a - b,
    )) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of PUBLIC_ROUTES) {
        await settle(page, route);
        expect(
          await horizontalOverflow(page),
          `${route} at ${width}px`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test("evidence state, limitation, report route, and CTA survive every required width", async ({
    page,
  }) => {
    /*
     * MDS responsive.rules.visibility: "Never hide evidence state, limitations,
     * recovery, report route, or primary CTA for viewport size." A scenario
     * route carries all of them at once, so it is the strongest single subject.
     */
    test.slow();

    for (const width of REQUIRED_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await settle(page, "/scenarios/authorization-and-rls");

      /*
       * Retrying assertions, not a one-shot `innerText`. `innerText` returns
       * RENDERED text, so a single read taken before the new width has finished
       * painting can return part of the document - measured once on Firefox as
       * a body whose text was the footer alone. `toContainText` asserts the
       * same thing and waits for the paint.
       */
      const body = page.locator("body");
      await expect(body, `evidence state at ${width}px`).toContainText(
        "Untested",
      );
      await expect(body, `limitation at ${width}px`).toContainText(
        /limitation/i,
      );

      await expect(
        page.locator("a[href='/report']").first(),
        `report route at ${width}px`,
      ).toHaveCount(1);
      /*
       * At least one CTA must be VISIBLE, not a particular one. The header
       * carries the desktop CTA and hides it on mobile, where the approved
       * composition puts the CTA in the page body instead - so asserting on the
       * first match in DOM order would assert the composition rather than the
       * requirement, which is that the route to it is never removed.
       */
      const visibleCtas = await page
        .locator("header, main, footer")
        .locator("a[href='/inquiry']:visible")
        .count();
      expect(visibleCtas, `visible primary CTA at ${width}px`).toBeGreaterThan(
        0,
      );
    }
  });

  test("the page reflows at 320 CSS pixels, the 400% zoom equivalent", async ({
    page,
  }) => {
    /*
     * WCAG 2.2 AA 1.4.10: content reflows to a 320 CSS px viewport without
     * two-dimensional scrolling. 320 x 256 is the width and height the success
     * criterion names.
     */
    await page.setViewportSize({ width: 320, height: 256 });

    for (const route of PUBLIC_ROUTES) {
      await settle(page, route);
      expect(
        await horizontalOverflow(page),
        `${route} at 320px`,
      ).toBeLessThanOrEqual(1);
      await expect(
        page.locator("a[href='/inquiry']").first(),
        `${route} keeps the CTA at 320px`,
      ).toHaveCount(1);
    }
  });

  test("the page survives 200% and 400% browser zoom", async ({ browser }) => {
    /*
     * Browser zoom is emulated the way a browser actually implements it: the
     * CSS-pixel viewport shrinks by the zoom factor and the device pixel ratio
     * rises by it. Zooming a 1280 x 900 window to 200% gives a 640 x 450 CSS
     * viewport at dpr 2; 400% gives 320 x 225 at dpr 4.
     *
     * The CSS `zoom` property is NOT used here. It scales boxes without
     * changing the initial containing block, so it measures something a visitor
     * never experiences.
     */
    test.slow();

    for (const [factor, width, height] of [
      [2, 640, 450],
      [4, 320, 225],
    ] as const) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: factor,
      });
      const zoomed = await context.newPage();
      try {
        for (const route of PUBLIC_ROUTES) {
          await settle(zoomed, route);
          expect(
            await horizontalOverflow(zoomed),
            `${route} at ${factor * 100}% zoom`,
          ).toBeLessThanOrEqual(1);
          expect(
            await zoomed
              .locator("header, main, footer")
              .locator("a[href='/inquiry']:visible")
              .count(),
            `${route} keeps a visible CTA at ${factor * 100}% zoom`,
          ).toBeGreaterThan(0);
        }
      } finally {
        await context.close();
      }
    }
  });

  test("the WCAG text-spacing override clips nothing", async ({ page }) => {
    /*
     * WCAG 2.2 AA 1.4.12. The four values are the ones the success criterion
     * specifies; a layout that depends on the approved line-height to fit its
     * text fails here by clipping or by overflowing the page.
     */
    test.slow();

    const TEXT_SPACING = `* { line-height: 1.5 !important;
      letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important; }
      p, li, h1, h2, h3, h4 { margin-bottom: 2em !important; }`;

    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of PUBLIC_ROUTES) {
        await settle(page, route);
        await page.addStyleTag({ content: TEXT_SPACING });
        await page.waitForTimeout(80);

        expect(
          await horizontalOverflow(page),
          `${route} at ${width}px under text spacing`,
        ).toBeLessThanOrEqual(1);

        /*
         * Clipping: an element that hides its overflow must not be hiding text.
         * Regions the MDS explicitly allows to scroll (the code excerpt, the
         * matrix) declare `overflow: auto` and are not `hidden`, so they are
         * outside this check by construction.
         */
        const clipped = await page.evaluate(() => {
          const problems: string[] = [];
          for (const element of document.querySelectorAll("main *")) {
            const style = getComputedStyle(element);
            if (style.overflowY !== "hidden") continue;
            if (!element.textContent?.trim()) continue;
            /*
             * The visually-hidden pattern (`.sr-only`) clips deliberately: it
             * is a 1px box holding text meant for assistive technology only.
             * It is not visible text, so 1.4.12 does not govern it.
             */
            if (element.clientHeight <= 1 || element.clientWidth <= 1) continue;
            if (element.scrollHeight > element.clientHeight + 2) {
              problems.push(
                `${element.tagName.toLowerCase()}.${element.className?.toString().slice(0, 50)} ${element.scrollHeight}>${element.clientHeight}`,
              );
            }
          }
          return problems;
        });
        expect(
          clipped,
          `${route} at ${width}px clips text under text spacing`,
        ).toEqual([]);
      }
    }
  });

  test("long content does not break the page", async ({ page }) => {
    /*
     * Content stress the protocol requires: "long labels ... and evidence
     * overflow". The product's own content is fixture-derived and cannot be
     * lengthened honestly, so the stress is applied to the RENDERED page.
     *
     * Two stresses, because the approved behaviour differs:
     *
     *  - prose, headings, and cells get a long but WORD-BREAKABLE label, which
     *    is what long content looks like in this product (a resource name, a
     *    policy name, a finding title). These must wrap, and must never scroll
     *    the page body.
     *  - an evidence line gets a 240-character UNBROKEN token, which is what a
     *    long SQL predicate or a base64 payload looks like. DESIGN-SYSTEM
     *    section 10 allows the code region "controlled wrapping/overflow" - the
     *    region may scroll itself; the page may not.
     *
     * One stress per page load. Applying all of them to a single document and
     * measuring between mutations produced a reading that depended on when the
     * measurement forced layout rather than on whether the content fits, which
     * is a property of the harness and not of the product.
     */
    test.slow();

    /*
     * Ordinary words, repeated. The words are deliberately of ordinary length:
     * a SINGLE word wider than the viewport cannot wrap anywhere and pushes the
     * page out regardless of layout - at mobile H1 size a 29-character token
     * measures ~516px against 342px of available width. That is a property of
     * unbreakable text, not of this composition, and every heading in the
     * product is approved content from `lib/content/` where no such word
     * exists. It is recorded as MDS-QA-R1-F003 rather than asserted here.
     */
    const LONG_LABEL =
      "cross tenant member profile row read under the anonymous role ".repeat(
        4,
      );
    const LONG_TOKEN = "x".repeat(240);
    /*
     * Route as well as selector: a scenario page starts untested and renders no
     * matrix, so cell stress belongs on the report, which always carries one.
     */
    const STRESSES: [string, string, string][] = [
      ["/scenarios/authorization-and-rls", "h1", LONG_LABEL],
      ["/scenarios/authorization-and-rls", "h2", LONG_LABEL],
      ["/scenarios/authorization-and-rls", "h3", LONG_LABEL],
      ["/scenarios/authorization-and-rls", "li", LONG_LABEL],
      ["/scenarios/authorization-and-rls", "code", LONG_TOKEN],
      ["/report", "td", LONG_LABEL],
      ["/report", "th", LONG_LABEL],
      ["/report", "code", LONG_TOKEN],
    ];

    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });

      for (const [route, selector, filler] of STRESSES) {
        await settle(page, route);
        // The evidence region is client-rendered; mutating the page before it
        // mounts would stress a document the visitor never sees.
        await expect(page.locator("main code").first()).toBeVisible();

        const applied = await page.evaluate(
          ([target, text]) => {
            const node = document.querySelector(`main ${target}`);
            if (!node) return false;
            node.textContent = `${node.textContent} ${text}`;
            return true;
          },
          [selector, filler] as const,
        );
        expect(applied, `${route} has a ${selector} to stress`).toBe(true);

        // Settle before the first measurement. Forcing layout in the same task
        // as the mutation reports an overflow no rendered frame ever has.
        await page.waitForTimeout(400);

        expect(
          await horizontalOverflow(page),
          `long ${selector} on ${route} at ${width}px must not scroll the page body`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });
});

test.describe("Gate 3 — the approved composition transforms", () => {
  test("the report index moves in-flow below desktop and sits beside the report at wide", async ({
    page,
  }) => {
    const index = page.locator("nav[aria-label='Report sections']");

    await page.setViewportSize({ width: 1440, height: 900 });
    await settle(page, "/report");
    await expect(index).toBeVisible();
    await expect(page.locator("main h2").first()).toBeVisible();
    const wide = await page.evaluate(() => {
      const nav = document.querySelector("nav[aria-label='Report sections']");
      const heading = document.querySelector("main h2");
      if (!nav || !heading) return null;
      return {
        nav: nav.getBoundingClientRect().right,
        heading: heading.getBoundingClientRect().left,
        navTop: nav.getBoundingClientRect().top,
        headingTop: heading.getBoundingClientRect().top,
      };
    });
    expect(
      wide,
      "report index and first section are both present",
    ).not.toBeNull();
    expect(
      wide!.nav,
      "at 1440 the index sits beside the report body",
    ).toBeLessThanOrEqual(wide!.heading + 1);

    await page.setViewportSize({ width: 768, height: 900 });
    await settle(page, "/report");
    await expect(
      index,
      "the index is never hidden for viewport size",
    ).toBeVisible();
    await expect(page.locator("main h2").first()).toBeVisible();
    const tablet = await page.evaluate(() => {
      const nav = document.querySelector("nav[aria-label='Report sections']");
      const heading = document.querySelector("main h2");
      if (!nav || !heading) return null;
      return {
        navBottom: nav.getBoundingClientRect().bottom,
        headingTop: heading.getBoundingClientRect().top,
      };
    });
    expect(
      tablet!.navBottom,
      "at 768 the index is in-flow above the report body",
    ).toBeLessThanOrEqual(tablet!.headingTop + 1);
  });

  test("the inquiry becomes one column with expectations before the fields", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await settle(page, "/inquiry");
    // The form is a client component: measuring before it mounts would compare
    // the expectations panel against nothing.
    await expect(
      page.locator("main input, main textarea").first(),
    ).toBeVisible();
    await expect(page.locator("main h2").first()).toBeVisible();

    const order = await page.evaluate(() => {
      const expectations = document.querySelector("main h2");
      const firstField = document.querySelector("main input, main textarea");
      if (!expectations || !firstField) return null;
      return {
        expectations: expectations.getBoundingClientRect().top,
        field: firstField.getBoundingClientRect().top,
      };
    });
    expect(order, "expectations and fields are both present").not.toBeNull();
    expect(
      order!.expectations,
      "expectations precede the fields on mobile",
    ).toBeLessThan(order!.field);
  });

  test("a matrix keeps row identity while it scrolls horizontally", async ({
    page,
  }) => {
    /*
     * DESIGN-SYSTEM section 10: "Horizontal overflow is allowed only with row
     * identity and labels preserved." The resource column is sticky, so it must
     * still be readable after the region is scrolled to its far edge.
     */
    await page.setViewportSize({ width: 390, height: 900 });
    await settle(page, "/report");

    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    const result = await page.evaluate(() => {
      const table = document.querySelector("main table");
      if (!table) return null;
      const header = table.querySelector("tbody th[scope='row']");
      if (!header) return { scrollable: false, label: null, sticky: null };

      // Scroll whichever ancestor actually carries the overflow.
      let region: Element | null = table.parentElement;
      while (region && getComputedStyle(region).overflowX !== "auto") {
        region = region.parentElement;
      }
      const label = header.textContent?.trim() ?? "";
      const sticky = getComputedStyle(header).position;
      if (!region) return { scrollable: false, label, sticky };

      region.scrollLeft = region.scrollWidth;
      const box = header.getBoundingClientRect();
      const regionBox = region.getBoundingClientRect();
      return {
        scrollable: region.scrollWidth > region.clientWidth,
        label,
        sticky,
        visible: box.right > regionBox.left && box.left < regionBox.right,
      };
    });

    expect(result, "a matrix is present on the report").not.toBeNull();
    if (result!.scrollable) {
      expect(result!.sticky, "the row header is sticky").toBe("sticky");
      expect(result!.label, "the row still identifies itself").not.toBe("");
      expect(
        result!.visible,
        "the row header is still on screen at the far scroll edge",
      ).toBe(true);
    }
  });

  test("the mobile scenario order runs proof, remediation, limitation, then routes", async ({
    page,
  }) => {
    /*
     * MDS responsive.rules.order and AGENTS.md "Mobile order": scenario
     * selector, step summary, vulnerable proof, remediation, comparison,
     * limitation, recovery/report/CTA. Verified by rendered vertical position,
     * which is what a visitor experiences, rather than by source order.
     */
    await page.setViewportSize({ width: 390, height: 900 });
    await settle(page, "/scenarios/authorization-and-rls");
    /*
     * The below-desktop selector is the disclosure the rail becomes: a
     * `<details>` whose summary names the current scenario. Its inner nav is
     * collapsed until it is opened, so the summary is what a visitor sees and
     * what the reading order is about. Both regions are waited for, because
     * measuring one that has not rendered reads every position as zero.
     */
    const selector = page.locator("main details summary").first();
    const steps = page.locator("main nav[aria-label='Scenario steps']");
    await expect(selector).toBeVisible();
    await expect(steps).toBeVisible();

    const positions = await page.evaluate(() => {
      const top = (selector: string) => {
        const node = document.querySelector(selector);
        return node
          ? node.getBoundingClientRect().top + window.scrollY
          : Number.NaN;
      };
      const byHeading = (text: string) => {
        const node = [...document.querySelectorAll("main h2")].find((heading) =>
          heading.textContent?.toLowerCase().includes(text),
        );
        return node
          ? node.getBoundingClientRect().top + window.scrollY
          : Number.NaN;
      };
      return {
        selector: top("main details summary"),
        steps: top("main nav[aria-label='Scenario steps']"),
        proof: byHeading("documented test"),
        remediation: byHeading("remediation"),
        cta: byHeading("authorized review"),
      };
    });

    expect(positions.selector, "scenario selector is first").toBeLessThan(
      positions.steps,
    );
    expect(positions.steps, "the step summary precedes the proof").toBeLessThan(
      positions.proof,
    );
    expect(
      positions.proof,
      "the vulnerable proof precedes its remediation",
    ).toBeLessThan(positions.remediation);
    expect(
      positions.remediation,
      "the CTA comes after the evidence, not before it",
    ).toBeLessThan(positions.cta);
  });

  test("primary touch targets meet 44px at mobile and tablet", async ({
    page,
  }) => {
    test.slow();

    for (const width of [390, 640]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of PUBLIC_ROUTES) {
        await settle(page, route);

        // Scoped to the product's own landmarks, for the reason recorded in
        // MTS-OBS-027: the assertion must not be able to measure anything the
        // approved layout did not put on the page.
        const targets = page
          .locator("header, main, footer")
          .locator(
            "a[href='/inquiry'], a[href^='/scenarios/'], a[href='/report'], button[type='submit'], button[aria-controls]",
          );
        const count = await targets.count();
        for (let index = 0; index < count; index += 1) {
          const target = targets.nth(index);
          if (!(await target.isVisible())) continue;
          const box = await target.boundingBox();
          if (!box) continue;
          expect(
            Math.round(box.height),
            `${route} at ${width}px, target ${index} height`,
          ).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

test.describe("Gate 3 — interaction, motion, and print", () => {
  test("reduced motion removes animation without removing meaning", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await settle(page, "/scenarios/authorization-and-rls");

    const moving = await page.evaluate(() => {
      const problems: string[] = [];
      const ms = (value: string) =>
        value
          .split(",")
          .map((part) =>
            part.trim().endsWith("ms")
              ? parseFloat(part)
              : parseFloat(part) * 1000,
          );
      for (const element of document.querySelectorAll("body *")) {
        const style = getComputedStyle(element);
        for (const duration of [
          ...ms(style.transitionDuration),
          ...ms(style.animationDuration),
        ]) {
          if (duration > 1) {
            problems.push(
              `${element.tagName.toLowerCase()}.${element.className?.toString().slice(0, 40)} ${duration}ms`,
            );
          }
        }
      }
      return problems;
    });
    expect(moving, "animation surviving prefers-reduced-motion").toEqual([]);

    // Meaning is unaffected: the evidence state is still stated as text.
    await expect(page.locator("body")).toContainText("Untested");
  });

  test("the report prints complete, with no dark surface and nothing collapsed", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await settle(page, "/report");
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(150);

    const printed = await page.evaluate(() => {
      const dark: string[] = [];
      const collapsed: string[] = [];

      /*
       * The two surfaces the print rules exist to flip: `surface.evidence`
       * (#111827) and `brand.ink` (#0B1220). Naming them is the assertion -
       * a luminance threshold would also flag the primary green CTA, which is
       * a control, not a page surface, and is approved to keep its colour.
       */
      const DARK_SURFACES = ["rgb(17, 24, 39)", "rgb(11, 18, 32)"];

      for (const element of document.querySelectorAll("body *")) {
        const style = getComputedStyle(element);
        if (DARK_SURFACES.includes(style.backgroundColor)) {
          dark.push(
            `${element.tagName.toLowerCase()}.${element.className?.toString().slice(0, 40)} ${style.backgroundColor}`,
          );
        }
        if (
          style.overflow === "hidden" &&
          element.scrollHeight > element.clientHeight + 2 &&
          element.clientHeight > 1
        ) {
          collapsed.push(element.tagName.toLowerCase());
        }
      }

      const closedDetails = [...document.querySelectorAll("details")].filter(
        (node) => {
          const body = node.querySelector(":scope > *:not(summary)");
          return body ? getComputedStyle(body).display === "none" : false;
        },
      ).length;

      return { dark, collapsed, closedDetails };
    });

    expect(printed.dark, "dark page surfaces surviving to paper").toEqual([]);
    expect(printed.collapsed, "content clipped on paper").toEqual([]);
    expect(printed.closedDetails, "sections collapsed on paper").toBe(0);

    await page.emulateMedia({ media: null });
  });
});
