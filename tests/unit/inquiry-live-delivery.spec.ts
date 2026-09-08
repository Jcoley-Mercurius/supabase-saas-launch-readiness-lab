import { expect, test } from "@playwright/test";
import { notifyOperator, notificationConfigured } from "@/lib/inquiry/notify";
import { validateInquiry } from "@/lib/inquiry/schema";

/*
 * The live delivery check — the one test in this repository that sends a real
 * message to a real destination.
 *
 * Trace: MTS-CAP-007 (the notification half), MTS-OBS-042, MTS-DEC-014
 *        ("build it, and ask before the first real send").
 *
 * It is SKIPPED unless INQUIRY_LIVE_DELIVERY=1 is set, so it can never fire
 * from `pnpm check`, from CI, or from an ordinary unit run. Running it is a
 * deliberate operator act that needs the owner's configured credential and
 * their explicit instruction, which is exactly the gate MTS-DEC-014 asks for.
 *
 * It exercises the real path — notifyOperator through resendTransport — rather
 * than a copy of it, so a pass is evidence about the shipped module and not
 * about the test. It sends to INQUIRY_NOTIFICATION_TO and nowhere else, and it
 * prints no key, no address, and no provider payload.
 */

const ENABLED = process.env.INQUIRY_LIVE_DELIVERY === "1";

test.describe("live operator notification", () => {
  test.skip(!ENABLED, "Set INQUIRY_LIVE_DELIVERY=1 to send a real message.");

  test("a real message reaches the configured destination", async () => {
    expect(
      notificationConfigured(),
      "RESEND_API_KEY, RESEND_FROM_EMAIL, and INQUIRY_NOTIFICATION_TO must all be set",
    ).toBe(true);

    const validated = validateInquiry({
      contactName: "Delivery check (synthetic)",
      contactEmail: "delivery-check@example.invalid",
      organization: "Launch-Readiness Lab",
      buyerRole: "Verification harness",
      stackSummary: "Next.js on Vercel, Supabase Postgres, Resend",
      launchTrigger: "pre-launch",
      reviewAreas: ["authorization-and-rls"],
      reviewRequest:
        "This is the S5 live delivery check. It is a synthetic inquiry sent by the verification harness to confirm that the notification boundary can reach the configured operator destination. No buyer submitted it and no inquiry record exists for it.",
      authorizationStatus: "authorized-by-me",
      authorizationAcknowledged: true,
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const result = await notifyOperator(validated.value, "live-delivery-check");

    // On failure, report the coarse class only — the provider response can
    // echo the message back, and the message is the inquiry.
    expect(
      result,
      result.sent ? "" : `delivery failed with class: ${result.failureClass}`,
    ).toEqual({ sent: true });
  });
});
