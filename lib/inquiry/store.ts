import "server-only";
import { dedupeKey } from "@/lib/inquiry/dedupe";
import { serverClient, supabaseConfigured } from "@/lib/supabase/server-client";
import type { InquiryInput } from "@/lib/inquiry/schema";

/*
 * The inquiry store client.
 *
 * Trace: MTS INTEGRATION-MANIFEST (inquiry route, Supabase inquiry store);
 *        MTS SECURITY-ARCHITECTURE ("keep service keys server-only", "keep
 *        production inquiry data separate from synthetic fixtures and reset
 *        commands").
 *
 * MTS-RISK-001 RESIDUAL — read this before changing anything here.
 *
 * The recorded control for MTS-RISK-001 is that the deployed application holds
 * no runtime database client at all, so a crafted request cannot reach a
 * database through it. S5 necessarily adds one, and the residual the risk
 * record names is precisely this file. Four things keep the control intact:
 *
 *   1. This module constructs no database client of its own. Exactly one
 *      module in the repository does — lib/supabase/server-client.ts — and
 *      this file is one of its two callers (MTS-CHG-019). lib/evidence/* holds
 *      no connection, no credential, and no endpoint, and imports nothing from
 *      lib/inquiry/*.
 *   2. The import graph is one-way and tested. tests/unit/inquiry-boundary
 *      walks the static imports of both trees and fails if either reaches the
 *      other, so the separation cannot decay into a convenience import.
 *   3. `server-only` makes a client-component import of this file a build
 *      error, so the client cannot be bundled into the browser by mistake.
 *   4. The shared factory builds the client with the PUBLISHABLE key, never a
 *      service-role key. That key reaches no table: every privilege on both
 *      inquiry tables is revoked and RLS is enabled with no policy. Its entire
 *      reach is the two SECURITY DEFINER functions, which accept a closed set
 *      of scalars and return no inquiry content. INTEGRATION-MANIFEST admits a
 *      service-role key "only if a later approved server operation requires
 *      it"; none does, so none is read anywhere.
 *
 * The store is also allowed to be absent. An unconfigured environment returns
 * `unconfigured` and the submission ends as UNCONFIRMED — never acknowledged.
 * MPS-REQ-011 permits an acknowledgement only after a successful submission,
 * so "no store" must read as "not confirmed", not as "received".
 */

export type StoreOutcome =
  | { outcome: "accepted"; reference: string }
  | {
      outcome: "duplicate";
      reference: string;
      submittedAt: string;
      submissionCount: number;
    }
  | { outcome: "rate_limited" }
  | { outcome: "unavailable" }
  | { outcome: "unconfigured" };

type Environment = "local" | "preview" | "production";

function environment(): Environment {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "local";
}

function client() {
  return serverClient("inquiry");
}

export interface InquiryStore {
  submit(input: InquiryInput): Promise<StoreOutcome>;
  recordDelivery(
    reference: string,
    outcome: "sent" | "failed",
    failureClass?: string,
  ): Promise<void>;
}

export const supabaseInquiryStore: InquiryStore = {
  async submit(input) {
    const db = client();
    if (!db) return { outcome: "unconfigured" };

    const { data, error } = await db.rpc("submit_inquiry", {
      p_dedupe_key: dedupeKey(input.contactEmail),
      p_contact_name: input.contactName,
      p_contact_email: input.contactEmail,
      p_organization: input.organization || null,
      p_buyer_role: input.buyerRole,
      p_stack_summary: input.stackSummary,
      p_launch_trigger: input.launchTrigger,
      p_review_areas: input.reviewAreas,
      p_review_request: input.reviewRequest,
      p_authorization_status: input.authorizationStatus,
      p_environment: environment(),
    });

    // The error is deliberately not inspected, forwarded, or logged: a
    // PostgREST error can carry the failing statement, and the failing
    // statement here carries the buyer's inquiry.
    if (error || !data) return { outcome: "unavailable" };

    const result = data as Record<string, unknown>;
    switch (result.outcome) {
      case "accepted":
        return { outcome: "accepted", reference: String(result.reference) };
      case "duplicate":
        return {
          outcome: "duplicate",
          reference: String(result.reference),
          submittedAt: String(result.submitted_at),
          submissionCount: Number(result.submission_count ?? 1),
        };
      case "rate_limited":
        return { outcome: "rate_limited" };
      default:
        return { outcome: "unavailable" };
    }
  },

  async recordDelivery(reference, outcome, failureClass) {
    const db = client();
    if (!db) return;
    // Best effort. A delivery result that cannot be written is operational
    // metadata missing a row; it must never change what the buyer is told
    // about their own submission, which already succeeded.
    await db.rpc("record_inquiry_delivery", {
      p_reference: reference,
      p_outcome: outcome,
      p_failure_class: failureClass ?? null,
    });
  },
};

/** True when the environment can actually reach a store. */
export function inquiryStoreConfigured() {
  return supabaseConfigured();
}
