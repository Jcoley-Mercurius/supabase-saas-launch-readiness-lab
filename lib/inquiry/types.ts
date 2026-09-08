/*
 * The states an inquiry submission can end in, and nothing else.
 *
 * Trace: MPS-REQ-011 (acknowledge ONLY after a successful submission),
 *        MPS-REQ-012 (recoverable states for failed and duplicate submission),
 *        MPS-RULE-005/006, MPS-ACC-011/012;
 *        MDS COMPOSITION-PROPOSAL "Inquiry shell" required visual states.
 *
 * The set is closed on purpose. Every outcome the buyer can be shown is named
 * here, so no code path can invent a ninth state and no failure can be
 * rendered as an acknowledgement. `acknowledged` is reachable from exactly one
 * place: a store outcome of "accepted".
 *
 * `delivered` on the acknowledgement is operational truth, not a promise. An
 * inquiry that is stored but whose operator notification failed is still
 * acknowledged — the record exists and will be seen — and the acknowledgement
 * says so rather than claiming a clean send (MTS SECURITY-ARCHITECTURE:
 * "Inquiry delivery failure preserves the inquiry record and exposes an
 * unconfirmed/retry path without promising engagement").
 */

import type { InquiryFieldErrors } from "@/lib/inquiry/schema";

export type InquiryOutcome =
  /** Stored for the first time. The only state that acknowledges receipt. */
  | {
      state: "acknowledged";
      delivered: boolean;
      /** The answer stopped at the authorization boundary (MPS-ACC-013). */
      authorizationBoundary: boolean;
    }
  /** Already on record. Links back to the original; implies no second engagement. */
  | {
      state: "duplicate";
      submittedAt: string;
      submissionCount: number;
      authorizationBoundary: boolean;
    }
  /** Nothing was stored. The buyer's entries are still in the form. */
  | { state: "invalid"; errors: InquiryFieldErrors }
  /** Abuse control tripped. Nothing was stored, nothing was acknowledged. */
  | { state: "rate_limited" }
  /** The store could not be reached. Explicitly NOT an acknowledgement. */
  | { state: "unconfirmed"; reason: "store" | "unconfigured" };

/** What the notification boundary reports back. Never a provider payload. */
export type DeliveryResult =
  | { sent: true }
  | {
      sent: false;
      failureClass: "transport" | "rejected" | "unconfigured" | "unknown";
    };
