/*
 * The four approved R1 scenarios (MPS-CAP-001..004, MPS-REQ-003..007).
 *
 * S1 owns scenario identity and entry only. Evidence execution, fixtures, and
 * result state belong to S2 (authorization/RLS, storage/configuration) and S3
 * (webhook replay, reliability/recovery), so every scenario is published here
 * in the canonical `untested` evidence state and nothing implies a result.
 *
 * Reference: MDS-REF-005 (scenario index), MDS-REF-009 panel 2 (mobile).
 */

import type { IconName } from "@/components/ui/icon";

export type Scenario = {
  slug: string;
  order: number;
  /** Risk pillar this scenario proves. */
  pillar: string;
  icon: IconName;
  /** Plain-language risk statement (MDS component spec — scenario card). */
  summary: string;
  /** The documented negative case a buyer will be able to run. */
  documentedTest: string;
  /**
   * Reading/exploration depth, never an execution-time promise
   * (MDS COMPONENTS-PROPOSAL — scenario card).
   */
  depth: string;
  /** Slice that publishes this scenario's evidence. */
  evidenceSlice: "S2" | "S3";
};

export const SCENARIOS: readonly Scenario[] = [
  {
    slug: "authorization-and-rls",
    order: 1,
    pillar: "Authorization & RLS",
    icon: "users",
    summary:
      "Evaluate row-level security, policies, roles, and multi-tenant data isolation in a realistic SaaS context.",
    documentedTest:
      "A user from one organization attempts to read another organization's data through the API.",
    depth: "Guided lab · evidence panel · RLS coverage matrix",
    evidenceSlice: "S2",
  },
  {
    slug: "storage-and-configuration",
    order: 2,
    pillar: "Storage & configuration",
    icon: "database",
    summary:
      "Review buckets, access controls, file policies, and project settings for common misconfigurations.",
    documentedTest:
      "An unauthenticated user attempts to access a private file in another tenant's storage bucket.",
    depth: "Guided lab · evidence panel · configuration finding",
    evidenceSlice: "S2",
  },
  {
    slug: "webhook-integrity",
    order: 3,
    pillar: "Webhook integrity",
    icon: "webhook",
    summary:
      "Assess signature verification, replay protection, and failure handling for inbound events.",
    documentedTest:
      "A forged webhook event with an invalid signature is submitted to the endpoint, and the same logical event is replayed.",
    depth: "Guided lab · event evidence · before/after comparison",
    evidenceSlice: "S3",
  },
  {
    slug: "reliability-and-recovery",
    order: 4,
    pillar: "Reliability & recovery",
    // The approved scenario cards use the clock here; the landing pillar row
    // uses the gear (MDS-REF-005 vs MDS-REF-002).
    icon: "clock",
    summary:
      "Check backups, monitoring, rate limits, and operational readiness for common failure scenarios.",
    documentedTest:
      "A simulated service outage prevents access to key data, and the documented recovery steps are validated.",
    depth: "Guided lab · failure and recovery evidence",
    evidenceSlice: "S3",
  },
] as const;

/** The optional recommended path (MDS scenario-index shell — never required). */
export const RECOMMENDED_SCENARIO_SLUG = "authorization-and-rls";

export function getScenario(slug: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.slug === slug);
}
