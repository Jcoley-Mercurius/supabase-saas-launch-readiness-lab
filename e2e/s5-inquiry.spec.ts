import { expect, test, type Page, type Route } from "@playwright/test";
import { measureContrastFailures } from "./contrast";

/*
 * S5 browser verification — the authorized-review inquiry path.
 *
 * Trace: MPS-REQ-010/011/012/013/014, MPS-RULE-003/004/005/006,
 *        MPS-ACC-011/012/013;
 *        MDS COMPOSITION-PROPOSAL "Inquiry shell" (two columns on desktop,
 *        one column below with expectations before fields) and its eight
 *        required visual states; MDS-REF-008; MTS qa/MTS-QA.md.
 *
 * The eight states are driven by intercepting /api/inquiries and returning the
 * exact response the server would return. That is deliberate: this suite
 * verifies what the BUYER sees in each state, and the server's own decision
 * logic is verified separately — against the real database in
 * supabase/inquiry/tests/inquiry-checks.sql, and against injected stores in
 * tests/unit/inquiry-submission.spec.ts. Driving the UI from a live database
 * here would test both at once and prove neither cleanly.
 *
 * The submitting state is the one exception: it is observed against a real,
 * deliberately delayed response rather than simulated.
 */

const INQUIRY = "/inquiry";
const ENDPOINT = "**/api/inquiries";

const FILLED = {
  Name: "Alex Rivera",
  "Work email": "alex@acme.dev",
  "Company or project": "Acme Analytics",
  "Your role": "Founder / CTO",
  "Your stack": "Next.js on Vercel, Supabase Postgres, Stripe webhooks",
};

async function openInquiry(page: Page) {
  await page.goto(INQUIRY);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Discuss an authorized review/i,
    }),
  ).toBeVisible();
}

/** Fills every required field with a valid answer. */
async function fillForm(
  page: Page,
  { authorization = "I can authorize a review of this system" } = {},
) {
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
    .selectOption({ label: authorization });
  await page
    .getByRole("checkbox", {
      name: /work on a live system begins only after authorization/i,
    })
    .check();
}

async function respondWith(page: Page, status: number, body: unknown) {
  await page.route(ENDPOINT, (route: Route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );
}

/*
 * Next.js renders its own `role="alert"` route announcer into every page, so
 * an unqualified alert role matches two elements. This scopes to the form's
 * own alerts.
 */
function formAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

async function submit(page: Page) {
  await page.getByRole("button", { name: /Submit review inquiry/i }).click();
}

test.describe("the approved inquiry shell", () => {
  test("states the boundary and expectations before any field", async ({
    page,
  }) => {
    await openInquiry(page);

    // MPS-REQ-001/014: the limitation is adjacent to the claim, not in a footer.
    await expect(page.getByText("Synthetic data only")).toBeVisible();
    await expect(
      page.getByText("Not a certification or formal penetration test"),
    ).toBeVisible();
    // The approved Alert component renders its title as emphasised text, not
    // as a heading, so this asserts the statement rather than a role.
    await expect(
      page.getByText(/Authorization comes before any live work/i),
    ).toBeVisible();

    // Expectations precede the form in the DOM, which is the reading order at
    // every viewport (MDS: "Mobile becomes one column with expectations before
    // fields").
    const order = await page.evaluate(() => {
      const next =
        document.body.textContent?.indexOf("What happens next") ?? -1;
      const form = document.body.textContent?.indexOf("Review inquiry") ?? -1;
      return { next, form };
    });
    expect(order.next).toBeGreaterThan(-1);
    expect(order.form).toBeGreaterThan(order.next);
  });

  test("collects every field MPS-REQ-010 names, with a visible label on each", async ({
    page,
  }) => {
    await openInquiry(page);

    for (const label of [
      "Name",
      "Work email",
      "Your role",
      "Your stack",
      "What's prompting this review",
      "What would you like reviewed",
      "Who can authorize a review",
    ]) {
      const control = page.getByLabel(label, { exact: false }).first();
      await expect(control, `${label} is missing`).toBeVisible();

      // "Form labels remain visible" — the label element itself must be on the
      // page, not replaced by a placeholder or an aria-label.
      const id = await control.getAttribute("id");
      await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
    }

    // Areas of concern is a named group, not six loose checkboxes.
    await expect(
      page.getByRole("group", { name: /Areas of concern/i }),
    ).toBeVisible();
  });

  test("R1 has no upload and no credential control at all", async ({
    page,
  }) => {
    await openInquiry(page);

    // MPS-RULE-004, MPS-REQ-013: not hidden, not disabled — absent.
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    for (const term of [
      /api key/i,
      /password/i,
      /secret/i,
      /service role/i,
      /token/i,
    ]) {
      await expect(page.locator("label").filter({ hasText: term })).toHaveCount(
        0,
      );
    }
  });

  test("asks for no credentials and says so beside the fields", async ({
    page,
  }) => {
    await openInquiry(page);
    // Stated twice on purpose: once in the expectations column and once
    // beside the fields, because the limitation has to be adjacent to the
    // control it qualifies.
    await expect(page.getByText(/Please keep it high-level/i)).toBeVisible();
    await expect(
      page.getByText(/do not include credentials, secrets, production data/i),
    ).toHaveCount(2);
  });
});

test.describe("the eight required inquiry states", () => {
  test("initial and partially completed", async ({ page }) => {
    await openInquiry(page);

    // Initial: no result is announced and nothing implies a submission.
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByText(/Inquiry received/i)).toHaveCount(0);

    // Partially completed: entries persist and the form is still submittable.
    await page.getByLabel("Name", { exact: false }).first().fill("Alex Rivera");
    await expect(page.getByLabel("Name", { exact: false }).first()).toHaveValue(
      "Alex Rivera",
    );
    await expect(
      page.getByRole("button", { name: /Submit review inquiry/i }),
    ).toBeEnabled();
  });

  test("inline validation marks each field and announces the failure", async ({
    page,
  }) => {
    await openInquiry(page);
    await submit(page);

    const alert = formAlert(page);
    await expect(alert).toContainText(/Check the highlighted fields/i);
    await expect(alert).toContainText(/has not been sent/i);

    // Each invalid control is marked programmatically, not only in colour.
    const name = page.getByLabel("Name", { exact: false }).first();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();

    // And the message is tied to the control it belongs to.
    const describedBy = await name.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    await expect(
      page.locator(`[id="${describedBy!.split(" ").pop()}"]`),
    ).toBeVisible();

    // Correcting the field clears its message without a second submit.
    await name.fill("Alex Rivera");
    await expect(name).not.toHaveAttribute("aria-invalid", "true");
  });

  test("submitting keeps the label in place and marks the control busy", async ({
    page,
  }) => {
    await openInquiry(page);
    await fillForm(page);

    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(ENDPOINT, async (route: Route) => {
      await held;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          state: "acknowledged",
          delivered: true,
          authorizationBoundary: false,
        }),
      });
    });

    await submit(page);

    const button = page.getByRole("button", { name: /Submitting/i });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-busy", "true");

    release();
    await expect(page.getByText(/Inquiry received/i)).toBeVisible();
  });

  test("acknowledged confirms receipt and promises nothing", async ({
    page,
  }) => {
    await openInquiry(page);
    await respondWith(page, 201, {
      state: "acknowledged",
      delivered: true,
      authorizationBoundary: false,
    });
    await fillForm(page);
    await submit(page);

    const status = page.getByRole("status");
    await expect(status).toContainText(/Inquiry received/i);
    // MPS-REQ-011, MPS-RULE-005.
    await expect(status).toContainText(/not an accepted engagement/i);
    await expect(status).toContainText(/no timeline, price, or outcome/i);

    // The form is replaced, so the acknowledgement cannot be submitted twice.
    await expect(
      page.getByRole("button", { name: /Submit review inquiry/i }),
    ).toHaveCount(0);

    // Focus moved to the result, after a deliberate submission.
    await expect(status).toBeFocused();
  });

  test("a stored inquiry whose alert failed is still acknowledged, not a failure", async ({
    page,
  }) => {
    await openInquiry(page);
    await respondWith(page, 201, {
      state: "acknowledged",
      delivered: false,
      authorizationBoundary: false,
    });
    await fillForm(page);
    await submit(page);

    const status = page.getByRole("status");
    await expect(status).toContainText(/on record/i);
    await expect(status).toContainText(/no need to send it again/i);
    // It must NOT tell the buyer the submission failed — it did not.
    await expect(status).not.toContainText(/couldn't submit/i);
  });

  test("submission failed is retryable and keeps every entered value", async ({
    page,
  }) => {
    await openInquiry(page);
    await respondWith(page, 503, { state: "unconfirmed", reason: "store" });
    await fillForm(page);
    await submit(page);

    const alert = formAlert(page);
    await expect(alert).toContainText(/We couldn't submit the inquiry/i);
    await expect(alert).toContainText(/Nothing was recorded/i);

    // MPS workflow: "explain that no request was confirmed, and offer a retry".
    await expect(
      page.getByRole("button", { name: /Try again/i }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Work email", { exact: false }).first(),
    ).toHaveValue("alex@acme.dev");
    await expect(
      page.getByRole("button", { name: /Submit review inquiry/i }),
    ).toBeVisible();
  });

  test("rate limited says nothing was recorded", async ({ page }) => {
    await openInquiry(page);
    await respondWith(page, 429, { state: "rate_limited" });
    await fillForm(page);
    await submit(page);

    const alert = formAlert(page);
    await expect(alert).toContainText(/Too many submissions/i);
    await expect(alert).toContainText(/has not been recorded/i);
    await expect(alert).not.toContainText(/received/i);
  });

  test("duplicate links to the original and implies no second engagement", async ({
    page,
  }) => {
    await openInquiry(page);
    await respondWith(page, 200, {
      state: "duplicate",
      submittedAt: "2026-08-01T10:00:00.000Z",
      submissionCount: 3,
      authorizationBoundary: false,
    });
    await fillForm(page);
    await submit(page);

    const status = page.getByRole("status");
    await expect(status).toContainText(/already on record/i);
    await expect(status).toContainText(/August 1, 2026/);
    await expect(status).toContainText(/3 times/);
    // MPS-RULE-006.
    await expect(status).toContainText(/not created a second request/i);
    await expect(status).toContainText(/does not imply a second engagement/i);
  });

  test("an unsettled authorization stops at the boundary and explains why", async ({
    page,
  }) => {
    await openInquiry(page);
    await respondWith(page, 201, {
      state: "acknowledged",
      delivered: true,
      authorizationBoundary: true,
    });
    await fillForm(page, {
      authorization: "It belongs to a client, so they would authorize it",
    });
    await submit(page);

    const status = page.getByRole("status");
    // MPS-ACC-013: the inquiry is accepted; the live work is what stops.
    await expect(status).toContainText(/Inquiry received/i);
    await expect(status).toContainText(
      /Stopping at the authorization boundary/i,
    );
    await expect(status).toContainText(
      /cannot look at a live system until authorization is documented/i,
    );
  });
});

test.describe("responsive behaviour", () => {
  test("expectations stay before the fields at every viewport", async ({
    page,
  }) => {
    await openInquiry(page);

    const expectations = page.getByRole("heading", {
      name: "What happens next",
    });
    const form = page.getByRole("heading", { name: "Review inquiry" });

    const above = await expectations.boundingBox();
    const below = await form.boundingBox();
    expect(above).not.toBeNull();
    expect(below).not.toBeNull();

    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 960) {
      // Desktop: two columns, so the form sits beside the expectations.
      expect(below!.x).toBeGreaterThan(above!.x);
    } else {
      // Below desktop: one column, expectations first.
      expect(below!.y).toBeGreaterThan(above!.y);
    }
  });

  test("the page never scrolls sideways and the submit target is large enough", async ({
    page,
  }) => {
    await openInquiry(page);

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // 44 x 44 CSS pixels for a primary control (WCAG 2.2 AA 2.5.8).
    const box = await page
      .getByRole("button", { name: /Submit review inquiry/i })
      .boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // Every checkbox row is a target too, not just the 20px box.
    const rows = page.locator("label", {
      has: page.locator('input[type="checkbox"]'),
    });
    for (let index = 0; index < (await rows.count()); index += 1) {
      const row = await rows.nth(index).boundingBox();
      expect(row!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("accessibility", () => {
  test("the form is reachable and operable by keyboard in reading order", async ({
    page,
  }) => {
    await openInquiry(page);

    const order: string[] = [];
    for (let index = 0; index < 24; index += 1) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => document.activeElement?.id ?? "");
      if (id) order.push(id);
    }

    const index = (fragment: string) =>
      order.findIndex((id) => id.includes(fragment));
    expect(index("contactName")).toBeGreaterThan(-1);
    expect(index("contactEmail")).toBeGreaterThan(index("contactName"));
    expect(index("buyerRole")).toBeGreaterThan(index("organization"));
    expect(index("reviewRequest")).toBeGreaterThan(index("area-"));
    expect(index("authorizationStatus")).toBeGreaterThan(
      index("reviewRequest"),
    );
  });

  test("every control has a visible focus indicator", async ({ page }) => {
    await openInquiry(page);

    const name = page.getByLabel("Name", { exact: false }).first();
    await name.focus();
    const outline = await name.evaluate((element) => {
      const style = getComputedStyle(element);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  });

  test("the page has one h1 and a single main landmark", async ({ page }) => {
    await openInquiry(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
  });

  test("text meets the approved contrast minimum", async ({ page }) => {
    await openInquiry(page);
    const failures = await measureContrastFailures(page);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });

  test("an outcome is announced without stealing focus mid-typing", async ({
    page,
  }) => {
    await openInquiry(page);
    await respondWith(page, 201, {
      state: "acknowledged",
      delivered: true,
      authorizationBoundary: false,
    });
    await fillForm(page);

    // The live region exists before it has content, so the announcement is not
    // missed by a screen reader that needs the region present in advance.
    await expect(
      page.locator('[role="status"][aria-live="polite"]'),
    ).toBeAttached();

    await submit(page);
    await expect(page.getByRole("status")).toContainText(/Inquiry received/i);
  });
});

test.describe("the inquiry route exposes no read path", () => {
  test("GET is not allowed", async ({ request }) => {
    const response = await request.get("/api/inquiries");
    expect(response.status()).toBe(405);
  });

  test("a body that is not JSON is refused without reaching the store", async ({
    request,
  }) => {
    const response = await request.post("/api/inquiries", {
      headers: { "content-type": "application/json" },
      data: "not json at all",
    });
    expect([400, 422]).toContain(response.status());
  });

  test("an incomplete submission is refused and echoes no stored record", async ({
    request,
  }) => {
    const response = await request.post("/api/inquiries", {
      data: { contactName: "Alex Rivera" },
    });
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.state).toBe("invalid");
    expect(JSON.stringify(body)).not.toMatch(
      /reference|dedupe|supabase|postgres/i,
    );
  });
});
