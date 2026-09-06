import { expect, test, type Page } from "@playwright/test";

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
  /*
   * WCAG 2.2 AA 1.4.3. Measured in the browser from computed styles rather than
   * from the token table, so a composition mistake (a softened white on the
   * brand surface, a muted token on the wrong surface) is caught where it
   * actually renders.
   *
   * Every leaf text node is checked against the first opaque background in its
   * ancestor chain. Large text uses the 3:1 threshold the guideline allows.
   */
  for (const route of PUBLIC_ROUTES) {
    test(`${route} meets AA text contrast`, async ({ page }) => {
      await page.goto(route);

      const failures = await page.evaluate(() => {
        const parse = (
          value: string,
        ): [number, number, number, number] | null => {
          const match = value.match(/rgba?\(([^)]+)\)/);
          if (!match) return null;
          const parts = match[1]
            .split(/[\s,/]+/)
            .filter(Boolean)
            .map(Number);
          return [parts[0], parts[1], parts[2], parts[3] ?? 1];
        };
        const channel = (c: number) => {
          const v = c / 255;
          return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        const luminance = ([r, g, b]: number[]) =>
          0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        const contrast = (a: number[], b: number[]) => {
          const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
          return (hi + 0.05) / (lo + 0.05);
        };
        const composite = (fg: number[], bg: number[]) =>
          [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));

        function backgroundOf(el: Element): number[] {
          let node: Element | null = el;
          while (node) {
            const rgba = parse(getComputedStyle(node).backgroundColor);
            if (rgba && rgba[3] > 0) {
              if (rgba[3] === 1) return rgba.slice(0, 3);
              const below = node.parentElement
                ? backgroundOf(node.parentElement)
                : [255, 255, 255];
              return composite(rgba, below);
            }
            node = node.parentElement;
          }
          return [255, 255, 255];
        }

        const problems: string[] = [];
        for (const el of document.querySelectorAll("body *")) {
          if (!el.textContent?.trim()) continue;
          // Leaf text only, so a container is not measured against its children.
          if (el.querySelector("*")) continue;
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.display === "none")
            continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;

          const fg = parse(style.color);
          if (!fg) continue;
          const bg = backgroundOf(el);
          const ratio = contrast(composite(fg, bg), bg);

          const size = parseFloat(style.fontSize);
          const weight = Number(style.fontWeight) || 400;
          const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
          const min = isLarge ? 3 : 4.5;

          if (ratio < min) {
            problems.push(
              `${ratio.toFixed(2)}:1 (min ${min}) — "${el.textContent.trim().slice(0, 45)}"`,
            );
          }
        }
        return problems;
      });

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

    /** Cards sharing the topmost row are the column count for that width. */
    async function columnCount(width: number) {
      await page.setViewportSize({ width, height: 900 });
      // Let the resize settle before measuring, so a pending layout from the
      // previous width cannot be read as the new composition.
      await page.waitForFunction(
        (expected) => window.innerWidth === expected,
        width,
      );
      await page.waitForTimeout(150);

      const tops = await page
        .locator("li a[href^='/scenarios/']")
        .evaluateAll((nodes) =>
          nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
        );
      const first = Math.min(...tops);
      return tops.filter((top) => Math.abs(top - first) <= 2).length;
    }

    expect(await columnCount(390), "mobile is 1-up").toBe(1);
    expect(await columnCount(768), "tablet is 2-up").toBe(2);
    expect(await columnCount(1000), "desktop is 2-up").toBe(2);
    expect(await columnCount(1440), "wide is 4-up").toBe(4);
  });

  test("no route scrolls horizontally at any approved width", async ({
    page,
  }) => {
    for (const width of [320, 390, 640, 768, 960, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of PUBLIC_ROUTES) {
        await page.goto(route);
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

    const targets = page.locator(
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

    const size = await page.evaluate(() =>
      parseFloat(window.getComputedStyle(document.body).fontSize),
    );
    expect(size).toBeGreaterThanOrEqual(16);
  });
});
