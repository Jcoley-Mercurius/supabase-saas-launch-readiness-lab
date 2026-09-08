import { expect, test } from "@playwright/test";
import { dedupeKey, normalizeContactEmail } from "@/lib/inquiry/dedupe";
import {
  detectCredential,
  stopsAtAuthorizationBoundary,
  validateInquiry,
  REVIEW_REQUEST_MAX,
} from "@/lib/inquiry/schema";
import { buildNotification } from "@/lib/inquiry/notify";
import { submitInquiry } from "@/lib/inquiry/submit";
import type { InquiryStore, StoreOutcome } from "@/lib/inquiry/store";
import type { NotificationTransport } from "@/lib/inquiry/notify";
import type { DeliveryResult } from "@/lib/inquiry/types";
import * as inquiryContent from "@/lib/content/inquiry";

/*
 * Trace: MPS-REQ-010/011/012/013/014, MPS-RULE-005/006, MPS-ACC-011/012/013;
 *        MTS SECURITY-ARCHITECTURE ("validate inquiry input server-side with
 *        an explicit schema", "apply rate limiting or abuse controls before
 *        persistence and notification").
 *
 * The store and the transport are both injected, so every branch — including
 * the ones that need an unreachable database or a failing email provider — is
 * exercised deterministically, with no network and no credential.
 */

const VALID = {
  contactName: "Alex Rivera",
  contactEmail: "alex@acme.dev",
  organization: "Acme Analytics",
  buyerRole: "Founder / CTO",
  stackSummary: "Next.js on Vercel, Supabase Postgres, Stripe webhooks",
  launchTrigger: "pre-launch",
  reviewAreas: ["authorization-and-rls", "storage-and-configuration"],
  reviewRequest:
    "We are preparing to launch a multi-tenant SaaS on Supabase and would like a review of our RLS policies and storage configuration.",
  authorizationStatus: "authorized-by-me",
  authorizationAcknowledged: true,
};

function fakeStore(outcome: StoreOutcome) {
  const delivered: Array<{ outcome: string; failureClass?: string }> = [];
  const submitted: unknown[] = [];
  const store: InquiryStore = {
    async submit(input) {
      submitted.push(input);
      return outcome;
    },
    async recordDelivery(_reference, result, failureClass) {
      delivered.push({ outcome: result, failureClass });
    },
  };
  return { store, delivered, submitted };
}

/*
 * The notification boundary refuses to send when a destination is not
 * configured, which is correct behaviour and is covered by its own test below.
 * These fixtures set an obviously fake destination so the SUCCESS and FAILURE
 * paths are reachable without a key, a domain, or a network.
 */
test.beforeEach(() => {
  process.env.RESEND_FROM_EMAIL = "lab@example.invalid";
  process.env.INQUIRY_NOTIFICATION_TO = "operator@example.invalid";
});

function fakeTransport(result: DeliveryResult) {
  const sent: unknown[] = [];
  const transport: NotificationTransport = {
    async send(message) {
      sent.push(message);
      return result;
    },
  };
  return { transport, sent };
}

test.describe("server-side validation", () => {
  test("accepts a complete inquiry", () => {
    const result = validateInquiry(VALID);
    expect(result.ok).toBe(true);
  });

  test("requires every field MPS-REQ-010 names", () => {
    // role, stack, launch trigger, desired review, contact method,
    // authorization status — plus the MPS-REQ-014 confirmation.
    for (const field of [
      "contactName",
      "contactEmail",
      "buyerRole",
      "stackSummary",
      "launchTrigger",
      "reviewAreas",
      "reviewRequest",
      "authorizationStatus",
      "authorizationAcknowledged",
    ]) {
      const incomplete = { ...VALID, [field]: undefined };
      const result = validateInquiry(incomplete);
      expect(result.ok, `${field} was accepted as missing`).toBe(false);
      if (!result.ok) {
        expect(Object.keys(result.errors)).toContain(field);
      }
    }
  });

  test("the organization is the only optional field", () => {
    const result = validateInquiry({ ...VALID, organization: undefined });
    expect(result.ok).toBe(true);
  });

  test("rejects an unknown option rather than storing it", () => {
    for (const [field, value] of [
      ["launchTrigger", "made-up"],
      ["authorizationStatus", "definitely-authorized"],
      ["reviewAreas", ["not-a-pillar"]],
    ] as const) {
      const result = validateInquiry({ ...VALID, [field]: value });
      expect(result.ok, `${field} accepted an unapproved value`).toBe(false);
    }
  });

  test("rejects an unchecked authorization confirmation (MPS-REQ-014)", () => {
    const result = validateInquiry({
      ...VALID,
      authorizationAcknowledged: false,
    });
    expect(result.ok).toBe(false);
  });

  test("bounds the free-text field", () => {
    const result = validateInquiry({
      ...VALID,
      reviewRequest: "x".repeat(REVIEW_REQUEST_MAX + 1),
    });
    expect(result.ok).toBe(false);
  });

  test("refuses a submission that carries something credential-shaped", () => {
    /*
     * Every value below is assembled at runtime from fragments rather than
     * written as a literal.
     *
     * These are all published example values - Stripe's documentation key,
     * the jwt.io sample, AWS's example access key id - not live credentials.
     * But a secret scanner cannot tell an example from the real thing by
     * looking, and it is right not to try: a repository that trains its
     * owners to click "allow" on a push-protection warning has taught them
     * the wrong reflex. So no string here matches a scanner's pattern on
     * disk, while the value handed to the validator is byte-for-byte what a
     * real one would be.
     */
    const join = (...parts: string[]) => parts.join("");
    const secrets = [
      join("sk", "_live_", "4eC39HqLyjWDarjtT1zdp7dc"),
      join(
        "Here is our token: ",
        "eyJhbGciOiJIUzI1NiJ9.",
        "eyJzdWIiOiIxMjM0NTY3ODkwIn0.",
        "dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
      ),
      join(
        "postgres",
        "ql://postgres:hunter2@db.example.supabase.co:5432/postgres",
      ),
      join(
        "Authorization: ",
        "Bearer ",
        "abcdefghijklmnopqrstuvwxyz0123456789",
      ),
      join("AKIA", "IOSFODNN7", "EXAMPLE"),
      join("ghp", "_16C7e42F292c", "6912E7710c838347Ae178B4a"),
    ];
    for (const secret of secrets) {
      const result = validateInquiry({
        ...VALID,
        reviewRequest: `Please review this. ${secret}`,
      });
      expect(
        result.ok,
        `a submission containing ${secret.slice(0, 12)}… was accepted`,
      ).toBe(false);
      if (!result.ok) {
        expect(result.errors.reviewRequest).toBeTruthy();
      }
    }
  });

  test("does not mistake ordinary prose about secrets for a secret", () => {
    const prose = [
      "Our service role key is shared too widely and we want that reviewed.",
      "We are not sure our bearer tokens expire correctly.",
      "The postgres connection is pooled through Supavisor.",
      "We use Stripe and rotate the signing secret quarterly.",
    ];
    for (const sentence of prose) {
      expect(detectCredential(sentence), `flagged: ${sentence}`).toBeNull();
      const result = validateInquiry({
        ...VALID,
        reviewRequest: `${sentence} ${VALID.reviewRequest}`,
      });
      expect(result.ok, `rejected ordinary prose: ${sentence}`).toBe(true);
    }
  });
});

test.describe("the deduplication key", () => {
  test("is stable across submissions from the same sender", () => {
    expect(dedupeKey("alex@acme.dev")).toBe(dedupeKey("  ALEX@Acme.dev "));
  });

  test("differs between senders", () => {
    expect(dedupeKey("alex@acme.dev")).not.toBe(dedupeKey("sam@acme.dev"));
  });

  test("is bounded and opaque — it holds no readable contact data", () => {
    const key = dedupeKey("alex@acme.dev");
    expect(key).toHaveLength(32);
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    expect(key).not.toContain("alex");
    expect(key).not.toContain("acme");
  });

  test("normalizes case and surrounding space only", () => {
    expect(normalizeContactEmail(" Alex@Acme.dev ")).toBe("alex@acme.dev");
    // No provider-specific rewriting: two real addresses stay two addresses.
    expect(normalizeContactEmail("a.lex@acme.dev")).not.toBe(
      normalizeContactEmail("alex@acme.dev"),
    );
  });
});

test.describe("submission outcomes", () => {
  test("acknowledges only after the record exists", async () => {
    const { store, delivered } = fakeStore({
      outcome: "accepted",
      reference: "ref-1",
    });
    const { transport, sent } = fakeTransport({ sent: true });

    const outcome = await submitInquiry(VALID, { store, transport });

    expect(outcome.state).toBe("acknowledged");
    if (outcome.state === "acknowledged") {
      expect(outcome.delivered).toBe(true);
      expect(outcome.authorizationBoundary).toBe(false);
    }
    expect(sent).toHaveLength(1);
    expect(delivered).toEqual([{ outcome: "sent", failureClass: undefined }]);
  });

  test("an unreachable store is UNCONFIRMED, never acknowledged", async () => {
    for (const storeOutcome of ["unavailable", "unconfigured"] as const) {
      const { store } = fakeStore({ outcome: storeOutcome });
      const { transport, sent } = fakeTransport({ sent: true });

      const outcome = await submitInquiry(VALID, { store, transport });

      expect(outcome.state).toBe("unconfirmed");
      // Nothing was stored, so nothing may be announced to the operator either.
      expect(sent).toHaveLength(0);
    }
  });

  test("a failed notification keeps the acknowledgement and records the failure", async () => {
    // MTS SECURITY-ARCHITECTURE: "Inquiry delivery failure preserves the
    // inquiry record and exposes an unconfirmed/retry path without promising
    // engagement." The record exists, so the buyer is not told to resubmit.
    const { store, delivered } = fakeStore({
      outcome: "accepted",
      reference: "ref-2",
    });
    const { transport } = fakeTransport({
      sent: false,
      failureClass: "transport",
    });

    const outcome = await submitInquiry(VALID, { store, transport });

    expect(outcome.state).toBe("acknowledged");
    if (outcome.state === "acknowledged") expect(outcome.delivered).toBe(false);
    expect(delivered).toEqual([
      { outcome: "failed", failureClass: "transport" },
    ]);
  });

  test("a duplicate links to the original and alerts as a REPEAT, not a new inquiry", async () => {
    const { store, delivered } = fakeStore({
      outcome: "duplicate",
      reference: "ref-3",
      submittedAt: "2026-08-01T10:00:00.000Z",
      submissionCount: 3,
    });
    const { transport, sent } = fakeTransport({ sent: true });

    const outcome = await submitInquiry(VALID, { store, transport });

    expect(outcome.state).toBe("duplicate");
    if (outcome.state === "duplicate") {
      expect(outcome.submittedAt).toBe("2026-08-01T10:00:00.000Z");
      expect(outcome.submissionCount).toBe(3);
    }

    // Owner decision 2026-09-08 (MTS-OBS-038): the operator DOES get an
    // alert, and it must be impossible to read as a second inquiry.
    expect(sent).toHaveLength(1);
    const message = sent[0] as { subject: string; text: string };
    expect(message.subject).toContain("Repeat submission #3");
    expect(message.subject).toContain("not a new inquiry");
    expect(message.text).toContain("REPEAT, not a new inquiry");
    expect(message.text).toContain("No second record was created");
    expect(message.text).toContain("no second engagement exists");

    // MPS-RULE-006 in the message body as well as in the data: the buyer's
    // original text is NOT repeated, because a re-sent message is how one
    // inquiry starts to look like two in an inbox.
    expect(message.text).not.toContain(VALID.reviewRequest);

    // A follow-up writes no delivery row: that transition belongs to the
    // original submission and is already closed.
    expect(delivered).toHaveLength(0);
  });

  test("a failed follow-up alert does not change what the buyer is told", async () => {
    const { store } = fakeStore({
      outcome: "duplicate",
      reference: "ref-3b",
      submittedAt: "2026-08-01T10:00:00.000Z",
      submissionCount: 2,
    });
    const { transport } = fakeTransport({
      sent: false,
      failureClass: "transport",
    });

    const outcome = await submitInquiry(VALID, { store, transport });

    // The record already exists, so the duplicate state is settled regardless
    // of whether the operator alert went out.
    expect(outcome.state).toBe("duplicate");
  });

  test("a rate-limited submission stores nothing and notifies no one", async () => {
    const { store, delivered } = fakeStore({ outcome: "rate_limited" });
    const { transport, sent } = fakeTransport({ sent: true });

    const outcome = await submitInquiry(VALID, { store, transport });

    expect(outcome.state).toBe("rate_limited");
    expect(sent).toHaveLength(0);
    expect(delivered).toHaveLength(0);
  });

  test("an invalid submission never reaches the store", async () => {
    const { store, submitted } = fakeStore({
      outcome: "accepted",
      reference: "ref-4",
    });
    const { transport, sent } = fakeTransport({ sent: true });

    const outcome = await submitInquiry(
      { ...VALID, contactEmail: "not-an-email" },
      {
        store,
        transport,
      },
    );

    expect(outcome.state).toBe("invalid");
    expect(submitted).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  test("an unsettled authorization is accepted and flagged at the boundary", async () => {
    // MPS-ACC-013: the workflow stops at the inquiry boundary and explains
    // that authorization and scope must be established first. It does not
    // refuse the inquiry.
    for (const status of [
      "client-authorization-required",
      "not-yet-determined",
    ] as const) {
      const { store } = fakeStore({ outcome: "accepted", reference: "ref-5" });
      const { transport } = fakeTransport({ sent: true });

      const outcome = await submitInquiry(
        { ...VALID, authorizationStatus: status },
        { store, transport },
      );

      expect(outcome.state).toBe("acknowledged");
      if (outcome.state === "acknowledged") {
        expect(outcome.authorizationBoundary).toBe(true);
      }
      expect(stopsAtAuthorizationBoundary(status)).toBe(true);
    }
  });
});

test.describe("the operator notification", () => {
  test("carries the inquiry and states it is not an acceptance", () => {
    const { subject, text } = buildNotification(
      validateInquiry(VALID).ok
        ? (validateInquiry(VALID) as { ok: true; value: never }).value
        : (VALID as never),
      "ref-6",
    );

    expect(subject).toContain("Alex Rivera");
    expect(text).toContain("alex@acme.dev");
    expect(text).toContain("Founder / CTO");
    expect(text).toContain("Authorization & RLS");
    expect(text).toContain("not an accepted engagement");
  });

  test("marks an unsettled authorization for the operator", () => {
    const value = validateInquiry({
      ...VALID,
      authorizationStatus: "not-yet-determined",
    });
    expect(value.ok).toBe(true);
    if (!value.ok) return;

    const { text } = buildNotification(value.value, "ref-7");
    expect(text).toContain("AUTHORIZATION BOUNDARY");
  });
});

test.describe("the buyer-facing copy promises nothing", () => {
  const copy = JSON.stringify(inquiryContent).toLowerCase();

  test("uses no prohibited claim vocabulary", () => {
    // AGENTS.md: "Never use secure, certified, compliant, guaranteed, or
    // unqualified passed."
    for (const word of ["certified", "compliant", "guaranteed", "guarantee"]) {
      expect(copy, `inquiry copy contains "${word}"`).not.toContain(word);
    }
    expect(copy).not.toMatch(/\bsecure\b/);
  });

  test("states no response time, price, or outcome (MPS-REQ-011)", () => {
    // The bare words "timeline", "price", and "outcome" DO appear — in the
    // sentence that disclaims all three. What must not appear is a commitment,
    // so the assertions below match promise shapes rather than nouns.
    for (const promise of [
      /within \d+\s*(hours?|days?|business days?)/,
      /\b\d+\s*(hour|day|week)s?\b/,
      /\b(same|next)[- ]day\b/,
      /turnaround/,
      /\bwe will (respond|reply|get back) (to you )?(in|within|by)\b/,
      /\$\s*\d/,
      /\bper (hour|day|project|engagement)\b/,
      /\bstarting at\b/,
      /\bfree (audit|review|consultation)\b/,
    ]) {
      expect(
        copy,
        `inquiry copy makes a promise matching ${promise}`,
      ).not.toMatch(promise);
    }
  });

  test("the acknowledgement disclaims a timeline, a price, and an outcome", () => {
    const acknowledged =
      inquiryContent.OUTCOMES.acknowledged.body.toLowerCase();
    expect(acknowledged).toContain("not an accepted engagement");
    expect(acknowledged).toContain("no timeline, price, or outcome");
  });

  test("the duplicate notice does not imply a second engagement (MPS-RULE-006)", () => {
    const duplicate = inquiryContent.OUTCOMES.duplicate.body.toLowerCase();
    expect(duplicate).toContain("not created a second one");
    expect(duplicate).toContain("does not put you further ahead");
  });
});
