import type { Metadata } from "next";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { PendingRoute } from "@/components/layout/pending-route";

/*
 * Sample report route.
 *
 * The report itself — executive summary, severity counts by documented state,
 * ordered findings, RLS matrix, webhook and recovery evidence, remediation
 * order, method and limitations, case study — is S4, and it is composed from
 * the evidence model that S2 and S3 build. S1 owns the route so the approved
 * navigation and the "report reachable without completing a scenario"
 * requirement (MPS-REQ-009, MPS-ACC-010) hold from the first slice.
 */

export const metadata: Metadata = {
  title: "Sample report",
  description:
    "The severity-ranked sample report for the Supabase SaaS Launch-Readiness Lab.",
};

export default function ReportPage() {
  return (
    <>
      <PendingRoute
        eyebrow="Sample report"
        title="The sample report is not published yet"
        description="The report ranks documented findings by severity and carries evidence, impact, remediation direction, before and after state, and the limitation for each one."
        publishedBy="This route exists so the report is always reachable from the navigation and from any scenario. Its content is assembled from documented scenario evidence, which is published in a later build stage."
      />
      <AuthorizedReviewBand />
    </>
  );
}
