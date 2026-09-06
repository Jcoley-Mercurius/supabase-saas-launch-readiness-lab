/*
 * Approved public narrative content for the S1 shell.
 *
 * Every string here traces to an approved MPS statement or approved MDS
 * reference copy. Copy is centralised so the shell composes it rather than
 * re-authoring it per page, and so a wording change is a single reviewable
 * diff against the canonical artefacts.
 *
 * Trace: MPS-REQ-001, MPS-REQ-002, MPS-REQ-009, MPS-REQ-013, MPS-REQ-014;
 * MPS-RULE-001/003/005/007; MDS composition proposal (landing, scenario index,
 * global navigation); MDS-REF-002, MDS-REF-005, MDS-REF-009.
 *
 * Prohibited vocabulary — secure, certified, compliant, guaranteed, or an
 * unqualified "passed" — must never appear in this file.
 */

import type { IconName } from "@/components/ui/icon";

export const PRODUCT = {
  name: "Supabase SaaS Launch-Readiness Lab",
  shortName: "Supabase SaaS",
  subName: "Launch-Readiness Lab",
  endorsement: "Built by Josh Coley · Mercurius",
  eyebrow: "Synthetic scenarios. Reproducible evidence. Authorized work only.",
  description:
    "A focused, engineering-led review of Supabase SaaS launch risk, using documented scenarios and synthetic data to surface material issues and practical fixes before you launch.",
} as const;

/** Global navigation (MDS composition proposal — global navigation). */
export const PRIMARY_NAV = [
  { href: "/scenarios", label: "Scenarios" },
  { href: "/report", label: "Sample report" },
  { href: "/method", label: "Method" },
  { href: "/about", label: "About the service" },
] as const;

/** Primary conversion action. It requests a conversation and promises nothing. */
export const PRIMARY_CTA = {
  href: "/inquiry",
  label: "Discuss an authorized review",
} as const;

/**
 * Service boundary statements. MPS-REQ-001 requires the limitation to be
 * visible before or alongside the interactive proof, and MDS requires the
 * limitation to stay adjacent to the claim it qualifies — so these render in
 * the hero and again in the footer band, never only in fine print.
 */
export const BOUNDARY_NOTES: ReadonlyArray<{ icon: IconName; label: string }> =
  [
    { icon: "flask", label: "Synthetic data only" },
    { icon: "info", label: "Not a certification or formal penetration test" },
  ];

/** Risk pillars (MPS-CAP-002/003/004; MDS-REF-002 "Four risk pillars"). */
export const RISK_PILLARS: ReadonlyArray<{
  icon: IconName;
  title: string;
  body: string;
}> = [
  {
    icon: "users",
    title: "Authorization & RLS",
    body: "Evaluate row-level security, policies, roles, and multi-tenant data isolation.",
  },
  {
    icon: "database",
    title: "Storage & configuration",
    body: "Review buckets, access controls, file policies, and project settings.",
  },
  {
    icon: "webhook",
    title: "Webhook integrity",
    body: "Assess signature verification, replay protection, and failure handling.",
  },
  {
    icon: "settings",
    title: "Reliability & recovery",
    body: "Check backups, monitoring, rate limits, and operational readiness.",
  },
];

/**
 * The approved scenario stepper vocabulary, exactly as locked by MDS
 * (DESIGN-SYSTEM.md §11): Context → Vulnerable proof → Remediation →
 * Repeated test → Limitation.
 *
 * Reference note: MDS-REF-002 renders a five-step service process labelled
 * Align / Run scenarios / Analyze / Report / Plan. The approved composition
 * text ("How the proof works: synthetic context → negative test → remediation
 * → repeated test → limitation") and the Gate 5 reconciliation, which replaced
 * exactly that unapproved stepper in the component library, both govern, so the
 * written vocabulary is used here.
 */
export const PROOF_STEPS = [
  {
    title: "Context",
    body: "Understand the synthetic scope, the affected boundary, and the risk.",
  },
  {
    title: "Vulnerable proof",
    body: "Run the documented negative test and reproduce the issue with evidence.",
  },
  {
    title: "Remediation",
    body: "Apply the documented fix and record what changed.",
  },
  {
    title: "Repeated test",
    body: "Repeat the same documented test and confirm it is blocked.",
  },
  {
    title: "Limitation",
    body: "State what the documented scenario does not cover.",
  },
] as const;

/**
 * Synthetic SaaS context (MPS-REQ-002, MPS-ACC-002; MDS-REF-005).
 * Descriptive only — no tenant, role, or event data is executed in S1.
 */
export const SYNTHETIC_CONTEXT: ReadonlyArray<{
  icon: IconName;
  title: string;
  body: string;
}> = [
  {
    icon: "users",
    title: "Multi-tenant application",
    body: "Multiple organizations with isolated data.",
  },
  {
    icon: "user",
    title: "Roles and permissions",
    body: "Organization owner, member, and viewer roles.",
  },
  {
    icon: "database",
    title: "Protected resources",
    body: "Project data, files, and API endpoints.",
  },
  {
    icon: "credit-card",
    title: "Representative payment events",
    body: "Subscription, upgrade, and invoice events.",
  },
];

export const SYNTHETIC_CONTEXT_NOTE =
  "These scenarios use a synthetic environment and sample data to illustrate common risks and fixes. They reflect real patterns, but they do not test your live systems.";
