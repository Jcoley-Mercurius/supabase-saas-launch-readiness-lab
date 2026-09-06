/*
 * Buyer-facing framing for the two S2 evidence scenarios.
 *
 * Trace: MPS-REQ-003/004/005, MPS-RULE-002/003/007, MPS-ACC-003/004/006;
 *        MDS DESIGN-SYSTEM.md §9-10 (evidence panel, finding summary,
 *        limitation callout), MDS-REF-006.
 *
 * What belongs here: the plain-language risk, severity, affected boundary,
 * remediation direction, and limitation — the parts a person authored.
 *
 * What does NOT belong here: any result. Every state, row, error, and policy
 * excerpt is read from the recorded transcript, so this file cannot make a
 * claim the database did not support.
 *
 * Prohibited vocabulary — secure, certified, compliant, guaranteed, or an
 * unqualified "passed" — must never appear in this file.
 */

import type { EvidenceScenarioId } from "@/lib/evidence/types";

export type EvidenceScenario = {
  id: EvidenceScenarioId;
  /** Finding heading shown in the summary band (MDS-REF-006). */
  finding: string;
  severity: "High" | "Medium" | "Low";
  /** Why this severity, in the buyer's terms. */
  severityBasis: string;
  impact: string;
  affectedArea: string;
  targetResource: string;
  tenantBoundary: string;
  tenantBoundaryNote: string;
  /** Which recorded relation's policies to show in the context panel. */
  policyResource: string;
  remediation: readonly string[];
  limitation: string;
};

export const EVIDENCE_SCENARIOS: Record<EvidenceScenarioId, EvidenceScenario> =
  {
    "authorization-and-rls": {
      id: "authorization-and-rls",
      finding: "Cross-tenant data exposure",
      severity: "High",
      severityBasis:
        "The documented test reached another tenant's records with an ordinary signed-in account and no elevated privilege.",
      impact:
        "A signed-in customer can read, change, and delete another customer's records, and can grant themselves standing membership of another tenant.",
      affectedArea:
        "synthetic.profiles, synthetic.org_members, and synthetic.invoices (tenant isolation)",
      targetResource: "synthetic.profiles",
      tenantBoundary: "tenant_id (uuid)",
      tenantBoundaryNote:
        "Each tenant should reach only the rows carrying its own tenant_id.",
      policyResource: "synthetic.profiles",
      remediation: [
        "Replace every unconditional using (true) predicate with one scoped to the caller's tenant.",
        "Give every write policy an explicit with check clause as well as using, and never widen the check to true to make a failing write succeed.",
        "Keep the read policy scoped too. PostgreSQL tests an updated row against the select policy as well, so a permissive read policy is what turns a widened write check into an escalation.",
        "Re-run the negative tests as part of the deployment pipeline, not once by hand.",
      ],
      limitation:
        "This scenario covers tenant isolation for the four fixture tables listed in the coverage matrix, under the two documented policy modes. It does not cover complex role hierarchies, service-role access, realtime channels, database functions, or any system other than this synthetic fixture.",
    },
    "storage-and-configuration": {
      id: "storage-and-configuration",
      finding: "Private object exposure and unenforced project configuration",
      severity: "High",
      severityBasis:
        "The documented test retrieved private tenant objects with no sign-in at all, and the configuration inspection found an exposed table with row level security switched off.",
      impact:
        "Private customer files are listable by an unauthenticated caller, an anonymous caller can write into a customer's bucket, and one exposed table consults no policy at all.",
      affectedArea:
        "synthetic.storage_objects (object visibility) and the fixture's grant and row-security configuration",
      targetResource: "synthetic.storage_objects",
      tenantBoundary: "tenant_id (uuid) + visibility",
      tenantBoundaryNote:
        "A private object should reach only its own tenant; a public object is reachable by design.",
      policyResource: "synthetic.storage_objects",
      remediation: [
        "Scope object read policies to the owning tenant and treat public visibility as an explicit, separate allowance rather than the default.",
        "Withdraw insert, update, and delete privileges from the anonymous role on every exposed relation.",
        "Enable row level security on every table reachable through a role grant. A grant without row level security consults no policy at all.",
        "Treat a policy predicate of true as a configuration defect and check for it automatically.",
      ],
      limitation:
        "This scenario proves object-level access rules and grant/row-security configuration on a synthetic stand-in for storage.objects. It stores metadata only and no file content. It does not test bucket-level settings in a hosted Supabase project, signed URL handling, CDN caching, image transformation, or any secret-management, environment-variable, or key-rotation control — none of those were exercised and none should be read as covered.",
    },
  };

/** Shown beside every result so a claim never travels without its scope. */
export const EVIDENCE_PROVENANCE_NOTE =
  "The lab replays a transcript recorded from an isolated local PostgreSQL fixture. The published application holds no database connection and runs no new query against any system.";
