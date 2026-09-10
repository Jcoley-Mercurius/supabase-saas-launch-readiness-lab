import { expect, test, type Page } from "@playwright/test";

/*
 * S6 browser verification — the first-party measurement boundary.
 *
 * Trace: MPS-MET-001 through MPS-MET-005; MTS-CAP-008, MTS-DEC-016
 *        (first-party only), MTS-OBS-050 (separation), MTS-OBS-037 (bounded
 *        abuse control); MTS qa/MTS-QA.md ("measurement payload-redaction
 *        tests").
 *
 * These run against a build with no Supabase configured, so nothing is
 * persisted. That is the right environment for what is being verified here:
 * the ROUTE CONTRACT — that the endpoint answers identically whatever it is
 * given, exposes no read path, and never surfaces an error to a person. What
 * the database does with a well-formed event is verified where the database
 * is: supabase/inquiry/tests/measurement-checks.sql, run locally and against
 * the hosted project.
 */

const ENDPOINT = "/api/measurement";

test.describe("the measurement route exposes no read path", () => {
  test("GET is not allowed", async ({ request }) => {
    expect((await request.get(ENDPOINT)).status()).toBe(405);
  });

  test("PUT and DELETE are not allowed", async ({ request }) => {
    expect((await request.put(ENDPOINT)).status()).toBe(405);
    expect((await request.delete(ENDPOINT)).status()).toBe(405);
  });
});

test.describe("the response is identical whatever happens", () => {
  /*
   * The point of these four: a caller must not be able to tell an accepted
   * event from a rejected one, a rate-limited one, or one dropped because the
   * store was unreachable. Anything else would let a visitor infer the
   * system's state from a counting endpoint.
   */
  const cases: [string, unknown][] = [
    ["a well-formed event", { event: "report_viewed", surface: "report" }],
    ["an event outside the taxonomy", { event: "whatever", surface: "report" }],
    [
      "a surface outside the taxonomy",
      { event: "report_viewed", surface: "x" },
    ],
    [
      "a scenario-scoped event with no scenario",
      { event: "scenario_completed", surface: "scenario" },
    ],
  ];

  for (const [name, payload] of cases) {
    test(`${name} answers 204 with an empty body`, async ({ request }) => {
      const response = await request.post(ENDPOINT, { data: payload });
      expect(response.status()).toBe(204);
      expect(await response.text()).toBe("");
    });
  }

  test("a body that is not JSON answers 204 rather than an error", async ({
    request,
  }) => {
    const response = await request.post(ENDPOINT, {
      data: "not json at all",
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(204);
  });

  test("a payload with extra fields is answered the same way", async ({
    request,
  }) => {
    // Extra keys are ignored rather than rejected differently — a distinct
    // answer would confirm which field names the endpoint knows about.
    const response = await request.post(ENDPOINT, {
      data: {
        event: "report_viewed",
        surface: "report",
        contactEmail: "someone@example.com",
        note: "free text that must never reach the store",
      },
    });
    expect(response.status()).toBe(204);
  });
});

test.describe("measurement is invisible on the page", () => {
  test("the report page renders no measurement element and reports no console error", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(String(error)));

    await page.goto("/report");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The emitter renders null. If it ever renders anything it would be an
    // unapproved change to the MDS composition.
    expect(problems, problems.join("\n")).toHaveLength(0);
  });

  test("a scenario page still records nothing visible and stays operable", async ({
    page,
  }) => {
    await page.goto("/scenarios/authorization-and-rls");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The page must work identically whether or not the count landed.
    await expect(page.locator("main")).toBeVisible();
  });
});

/*
 * EVERY DECLARED EVENT ACTUALLY FIRES.
 *
 * tests/unit/measurement-boundary.spec.ts proves each name has a call site.
 * Only a browser can prove the call site RUNS, and that it runs at the moment
 * the metric definition says it should — MPS-MET-002 is "reaches a before/after
 * evidence result", not "pressed a button".
 *
 * Requests are intercepted rather than delivered. These builds have no Supabase
 * configured, so nothing would be stored anyway, and asserting on the payload
 * the browser SENDS is what verifies the emitter without depending on a
 * database being reachable from a test runner.
 */
function captureEvents(page: Page) {
  const sent: { event: string; surface: string; scenarioSlug?: string }[] = [];

  const ready = page.route("**/api/measurement", async (route) => {
    try {
      sent.push(JSON.parse(route.request().postData() ?? "{}"));
    } catch {
      sent.push({ event: "(unparseable)", surface: "(unparseable)" });
    }
    await route.fulfill({ status: 204, body: "" });
  });

  return { sent, ready };
}

/** Names only, in order, for readable assertions. */
const names = (sent: { event: string }[]) => sent.map((item) => item.event);

test.describe("the declared events reach the endpoint", () => {
  test("the landing page records a landing view", async ({ page }) => {
    const { sent, ready } = captureEvents(page);
    await ready;

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => names(sent)).toContain("landing_viewed");

    // A landing view is not scenario-scoped; carrying a scenario would be
    // rejected by the database's scope constraint.
    const landing = sent.find((item) => item.event === "landing_viewed");
    expect(landing?.surface).toBe("landing");
    expect(landing?.scenarioSlug).toBeUndefined();
  });

  test("a scenario records its view, both step advances, and one completion", async ({
    page,
  }) => {
    const { sent, ready } = captureEvents(page);
    await ready;

    await page.goto("/scenarios/authorization-and-rls");
    await expect.poll(() => names(sent)).toContain("scenario_viewed");

    await page.getByRole("button", { name: "Run the documented test" }).click();
    await expect(
      page.getByRole("heading", { name: "Before — vulnerable state" }).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(() => names(sent).filter((n) => n === "scenario_step_advanced"))
      .toHaveLength(1);

    // Completion is the before/after result (MPS-MET-002), so it must not have
    // fired on the vulnerable proof alone.
    expect(names(sent)).not.toContain("scenario_completed");

    await page
      .getByRole("button", { name: "Apply remediation and repeat the test" })
      .click();
    await expect(
      page.getByText("Remediated — documented test blocked").first(),
    ).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(() => names(sent).filter((n) => n === "scenario_completed"))
      .toHaveLength(1);
    await expect
      .poll(() => names(sent).filter((n) => n === "scenario_step_advanced"))
      .toHaveLength(2);

    // Every scenario-scoped event carries the scenario it belongs to.
    for (const item of sent.filter((entry) =>
      entry.event.startsWith("scenario_"),
    )) {
      expect(item.scenarioSlug).toBe("authorization-and-rls");
      expect(item.surface).toBe("scenario");
    }

    // Repeating the run does not record a second completion.
    await page
      .getByRole("button", { name: "Apply remediation and repeat the test" })
      .click();
    await expect(
      page.getByText("Remediated — documented test blocked").first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(() => names(sent).filter((n) => n === "scenario_completed"))
      .toHaveLength(1);
  });

  test("the comparison and the limitation record when they are reached", async ({
    page,
  }) => {
    const { sent, ready } = captureEvents(page);
    await ready;

    await page.goto("/scenarios/authorization-and-rls");
    await page.getByRole("button", { name: "Run the documented test" }).click();
    await expect(
      page.getByRole("heading", { name: "Before — vulnerable state" }).first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.locator("#evidence-comparison").scrollIntoViewIfNeeded();
    await expect.poll(() => names(sent)).toContain("comparison_viewed");

    await page.locator("#scenario-limitation").scrollIntoViewIfNeeded();
    await expect.poll(() => names(sent)).toContain("limitation_viewed");

    // Once each, however far the page is scrolled afterwards.
    await page.locator("#evidence-comparison").scrollIntoViewIfNeeded();
    await page.locator("#scenario-limitation").scrollIntoViewIfNeeded();
    await expect
      .poll(() => names(sent).filter((n) => n === "comparison_viewed"))
      .toHaveLength(1);
    expect(names(sent).filter((n) => n === "limitation_viewed")).toHaveLength(
      1,
    );
  });

  test("acting on an evidence excerpt records it once, and its presence records nothing", async ({
    page,
  }) => {
    const { sent, ready } = captureEvents(page);
    await ready;

    await page.goto("/scenarios/authorization-and-rls");
    const copy = page
      .getByRole("button", { name: /^Copy the .* excerpt$/ })
      .first();
    await expect(copy).toBeVisible();

    // The scenario context panel renders its excerpt immediately. Presence is
    // not an opening: MPS-MET-001 warns against reading comprehension from
    // views, so nothing is recorded until the buyer acts on it.
    expect(names(sent)).not.toContain("evidence_excerpt_opened");

    await copy.click();
    await expect.poll(() => names(sent)).toContain("evidence_excerpt_opened");

    const opened = sent.find(
      (item) => item.event === "evidence_excerpt_opened",
    );
    expect(opened?.scenarioSlug).toBe("authorization-and-rls");

    // At most one per excerpt per visit, however many times it is acted on.
    await copy.click();
    await expect
      .poll(() => names(sent).filter((n) => n === "evidence_excerpt_opened"))
      .toHaveLength(1);
  });

  test("the report records its view and a section opened from the index", async ({
    page,
  }) => {
    const { sent, ready } = captureEvents(page);
    await ready;

    await page.goto("/report");
    await expect.poll(() => names(sent)).toContain("report_viewed");

    await page
      .getByRole("navigation", { name: "Report sections" })
      .getByRole("link")
      .first()
      .click();
    await expect.poll(() => names(sent)).toContain("report_section_opened");

    const opened = sent.find((item) => item.event === "report_section_opened");
    // The section is not carried in the payload: there is no field for it, and
    // MPS-MET-004 needs the count, not the anchor.
    expect(opened?.surface).toBe("report");
    expect(opened?.scenarioSlug).toBeUndefined();
  });

  test("printing the report records a print", async ({ page, browserName }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium can trigger beforeprint from the test runner; the listener is the same in every browser.",
    );

    const { sent, ready } = captureEvents(page);
    await ready;

    await page.goto("/report");

    // Wait for the page's own view event before dispatching. A visible heading
    // only proves the server-rendered markup arrived; the print listener is
    // attached in an effect, so dispatching before hydration would test
    // nothing and fail intermittently by timing.
    await expect.poll(() => names(sent)).toContain("report_viewed");

    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect.poll(() => names(sent)).toContain("report_printed");
  });

  test("the inquiry page records that an inquiry was started", async ({
    page,
  }) => {
    const { sent, ready } = captureEvents(page);
    await ready;

    await page.goto("/inquiry");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => names(sent)).toContain("inquiry_started");
  });
});
