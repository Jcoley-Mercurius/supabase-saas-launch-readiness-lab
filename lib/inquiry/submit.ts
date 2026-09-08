import "server-only";
import {
  stopsAtAuthorizationBoundary,
  validateInquiry,
} from "@/lib/inquiry/schema";
import { supabaseInquiryStore, type InquiryStore } from "@/lib/inquiry/store";
import {
  notifyOperator,
  notifyOperatorOfFollowUp,
  type NotificationTransport,
} from "@/lib/inquiry/notify";
import type { InquiryOutcome } from "@/lib/inquiry/types";

/*
 * The whole inquiry submission, in the order the security architecture
 * requires it: validate, then rate limit and deduplicate, then persist, then
 * notify.
 *
 * Trace: MPS-REQ-010/011/012, MPS-RULE-005/006, MPS-ACC-011/012/013;
 *        MTS SECURITY-ARCHITECTURE ("validate inquiry input server-side with
 *        an explicit schema", "apply rate limiting or abuse controls before
 *        persistence and notification", "inquiry delivery failure preserves
 *        the inquiry record and exposes an unconfirmed/retry path without
 *        promising engagement").
 *
 * Two ordering rules are load-bearing:
 *
 *   Acknowledgement follows persistence, never precedes it. MPS-REQ-011 allows
 *   an acknowledgement ONLY after a successful submission, so `acknowledged`
 *   is returned from exactly one branch — a store outcome of "accepted" — and
 *   an unreachable or unconfigured store ends as `unconfirmed`.
 *
 *   Notification follows persistence and cannot revoke it. Once the record
 *   exists the inquiry has been received; a failed notification is reported as
 *   an acknowledged submission whose operator alert did not go out, not as a
 *   failure. Downgrading it would tell the buyer to resubmit something that is
 *   already on record.
 *
 * NOTHING in this module logs. Not the input, not the result, not an error.
 * The inquiry is the payload, so a stack trace or a debug line is a disclosure
 * (MTS SECURITY-ARCHITECTURE; the playbook's "exclude inquiry content from
 * analytics and logs"). The route reports state through its return value.
 */

export async function submitInquiry(
  input: unknown,
  {
    store = supabaseInquiryStore,
    transport,
  }: { store?: InquiryStore; transport?: NotificationTransport } = {},
): Promise<InquiryOutcome> {
  const validated = validateInquiry(input);
  if (!validated.ok) return { state: "invalid", errors: validated.errors };

  const value = validated.value;
  const authorizationBoundary = stopsAtAuthorizationBoundary(
    value.authorizationStatus,
  );

  const stored = await store.submit(value);

  switch (stored.outcome) {
    case "rate_limited":
      return { state: "rate_limited" };

    case "unconfigured":
      return { state: "unconfirmed", reason: "unconfigured" };

    case "unavailable":
      return { state: "unconfirmed", reason: "store" };

    case "duplicate": {
      /*
       * No second record — and a follow-up alert that cannot be mistaken for
       * one (owner decision 2026-09-08, MTS-OBS-038).
       *
       * MPS-RULE-006 forbids a duplicate creating a duplicate engagement or
       * misrepresenting demand. What it does not require is that the operator
       * never learns someone followed up. So the record count stays at one,
       * the engagement count stays at one, and the message the operator gets
       * says "repeat submission #N", names the original, and repeats none of
       * the buyer's text.
       *
       * Its result is deliberately discarded. The buyer's outcome is settled
       * by the record that already exists; whether an operator alert went out
       * is not their concern and must not change what they are told.
       */
      await notifyOperatorOfFollowUp(
        value,
        stored.submissionCount,
        stored.submittedAt,
        transport,
      );
      return {
        state: "duplicate",
        submittedAt: stored.submittedAt,
        submissionCount: stored.submissionCount,
        authorizationBoundary,
      };
    }

    case "accepted": {
      const delivery = await notifyOperator(value, stored.reference, transport);
      await store.recordDelivery(
        stored.reference,
        delivery.sent ? "sent" : "failed",
        delivery.sent ? undefined : delivery.failureClass,
      );
      return {
        state: "acknowledged",
        delivered: delivery.sent,
        authorizationBoundary,
      };
    }
  }
}
