import type { Metadata } from "next";
import { PendingRoute } from "@/components/layout/pending-route";
import { LimitationCallout } from "@/components/ui/limitation-callout";

/*
 * Authorized-review inquiry route.
 *
 * The form, validation, submission, acknowledgement, duplicate, and failure
 * states are S5. S1 owns the route so the primary CTA resolves at every
 * viewport and the authorization boundary is stated before any field exists
 * (MPS-REQ-010..014; MPS-ACC-011..013).
 *
 * No field is rendered here. R1 has no upload or credential path at all
 * (MPS-RULE-004, MPS-REQ-013).
 */

export const metadata: Metadata = {
  title: "Discuss an authorized review",
  description:
    "Start a conversation about an authorized Supabase launch-readiness review. No credentials, production data, or uploads are ever requested.",
};

export default function InquiryPage() {
  return (
    <PendingRoute
      eyebrow="Get started"
      title="Discuss an authorized review"
      description="Share your goals and we'll confirm scope, answer questions, and outline next steps."
      publishedBy="The inquiry form is published in a later build stage. Until then, no inquiry can be submitted from this page and nothing you do here is recorded."
    >
      <LimitationCallout title="No uploads, credentials, or access required">
        <p>
          An inquiry asks for high-level context only — your role, your stack,
          what is triggering the launch, and what kind of review you want. It
          never asks for credentials, secrets, production data, or file uploads.
          An acknowledgement confirms only that the inquiry arrived: it is not
          an engagement acceptance and carries no timeline, price, or outcome.
          Work on a live system begins only after authorization and scope are
          documented and confirmed separately.
        </p>
      </LimitationCallout>
    </PendingRoute>
  );
}
