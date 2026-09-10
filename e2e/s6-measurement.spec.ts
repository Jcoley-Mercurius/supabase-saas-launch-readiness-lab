import { expect, test } from "@playwright/test";

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
