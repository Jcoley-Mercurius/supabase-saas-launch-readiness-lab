/*
 * Authored narrative for the sample report.
 *
 * Trace: MPS-REQ-001/008/009/013/014, MPS-RULE-001/003/005/007,
 *        MPS-ACC-009/010; MDS COMPOSITION-PROPOSAL "Audit report shell"
 *        (the eight approved sections, in order), DESIGN-SYSTEM.md §13;
 *        MDS-REF-007.
 *
 * This file is the report's authored layer and it is deliberately thin. It
 * holds framing, section identity, and narrative connective tissue only.
 *
 * It holds NO result, count, severity, state, or date. Every one of those is
 * derived in lib/evidence/report.ts from the committed transcripts, so a
 * sentence here cannot assert something the recorded evidence does not
 * support. Where the narrative needs a number it takes it from the model at
 * render time rather than stating one.
 *
 * Prohibited vocabulary — secure, certified, compliant, guaranteed, or an
 * unqualified "passed" — must never appear in this file.
 */

/** The eight approved report sections, in the approved order. */
export const REPORT_SECTIONS = [
  {
    id: "executive-summary",
    label: "Executive summary",
    heading: "Executive summary and synthetic scope",
  },
  {
    id: "severity-overview",
    label: "Severity overview",
    heading: "Severity overview by documented state",
  },
  {
    id: "findings",
    label: "Findings",
    heading: "Findings, ordered by launch risk",
  },
  {
    id: "coverage-matrix",
    label: "RLS coverage matrix",
    heading: "RLS coverage matrix",
  },
  {
    id: "webhook-recovery",
    label: "Webhook & recovery",
    heading: "Webhook and recovery evidence",
  },
  {
    id: "remediation",
    label: "Remediation order",
    heading: "Remediation order and reference patterns",
  },
  {
    id: "method-limitations",
    label: "Method & limitations",
    heading: "Method, limitations, and what was not tested",
  },
  {
    id: "case-study",
    label: "Case study",
    heading: "Case study and authorized review",
  },
] as const;

export type ReportSectionId = (typeof REPORT_SECTIONS)[number]["id"];

/** Report header band (MDS-REF-007 header). */
export const REPORT_HEADER = {
  eyebrow: "Sample report. Synthetic data only.",
  titleLead: "Launch-Readiness",
  titleEmphasis: "Review",
  standfirst:
    "An evidence-led review of a synthetic Supabase SaaS project, using documented scenarios that anyone can reproduce from this repository.",
  kicker: "Sample report",
} as const;

/**
 * The framing callout at the head of the report. It states what this document
 * is before any finding is read, which is what MPS-REQ-001 requires and what
 * keeps "sample" from being something a reader has to infer.
 */
export const REPORT_FRAMING = {
  title: "This is a sample report built on synthetic data",
  body: "It is written against a synthetic multi-tenant project created for this lab, to show the method, the evidence standard, and the report structure a real review produces. It is not a certification, an attestation, or a formal penetration test, and nothing in it describes any real customer, project, or system.",
} as const;

export const EXECUTIVE_SUMMARY = {
  intro:
    "This review ran a fixed set of documented checks against a synthetic multi-tenant Supabase project in two configurations: the project as found, and the same project after the documented fixes were applied. Nothing was scanned, guessed, or inferred — each check is a statement the database actually answered, and both runs are recorded in full.",
  scopeHeading: "What was in scope",
  scope: [
    "Tenant isolation across the fixture's four protected relations, under row level security policies and role grants.",
    "Object visibility and the grant and row-security configuration behind it, on a metadata-only stand-in for storage objects.",
    "The inbound webhook handler: signature verification, idempotency keying, ordering, and what it leaves behind when its downstream dependency fails.",
  ],
  outOfScopeHeading: "What was not in scope",
  outOfScope: [
    "Any live, hosted, or third-party system. No system outside this repository's fixture was contacted, and this document authorizes no testing of anything.",
    "Real credentials, real customer records, secret management, key rotation, and environment configuration in a hosted project.",
    "Network transport, TLS, endpoint authentication, provider-side retry policy, queue durability, rate limiting, monitoring, alerting, backup, and restore.",
  ],
} as const;

export const SEVERITY_OVERVIEW = {
  intro:
    "Counts below are of documented checks and their recorded states, not of estimated risk. Every check belongs to a finding, and every state is the one the check actually produced.",
  note: "A check that met its documented expectation in the configuration as found is not a clean bill of health for that area — it is one legitimate path behaving correctly while others in the same area did not.",
} as const;

export const FINDINGS_INTRO = {
  body: "Each finding carries its severity and the basis for it, the affected boundary, reproduction evidence from the recorded run, the plain-language impact, remediation direction, the before and after state of the same check, and the limitation on what it proves.",
  evidenceNote:
    "One representative check opens each finding: the first documented check that did not meet its expectation in the configuration as found. Every check in the area is runnable in that finding's scenario.",
} as const;

export const MATRIX_INTRO = {
  body: "The matrix below is the project as found. Every cell is classified: a check with a recorded result shows that result, a reachable operation with no documented check shows as untested, and an operation no application role can perform shows as not applicable with the grant that makes it so. No cell is left blank, and an absent check is never shown as a pass.",
} as const;

export const WEBHOOK_INTRO = {
  body: "A replay claim cannot be made by a single delivery, so the unit of evidence here is a documented sequence: an ordered set of deliveries with a required end state, checked both at the end and at named per-step checkpoints. The checkpoints matter — one sequence reaches the correct final count under the broken handler because two errors cancel out, and without a step checkpoint that sequence would have been reported as handled correctly.",
  configurationNote:
    "Both runs deliver identical events. The only thing that changes between them is the handler configuration, read back from the database rather than described.",
} as const;

export const REMEDIATION_INTRO = {
  body: "Remediation is listed in the same order as the findings, so the work runs in the order the risk and the dependencies justify. Each item is a direction and a reference pattern, not a patch: the fix belongs in your codebase, tested by your pipeline.",
  pipelineNote:
    "Every documented check in this report is re-runnable. The most durable outcome of a review is not the fix — it is the negative test that stays in the deployment pipeline afterwards and fails the build when the boundary regresses.",
} as const;

export const METHOD_INTRO = {
  body: "Each scenario follows the same five steps, and each step produces evidence that is kept rather than summarized.",
  reproducibility:
    "The fixture migrations, the documented tests, the documented sequences, and both recorded transcripts are committed to this repository. A digest ties each transcript to the exact fixture that produced it and is checked on every build, so an edited fixture cannot leave a stale transcript being shown as current, and an edited transcript fails its own check.",
} as const;

export const LIMITATIONS = {
  heading: "Limitations that apply to everything above",
  items: [
    {
      title: "Synthetic scope only",
      body: "Every result describes this synthetic fixture under its documented checks. A result here says nothing about your project, and nothing in this report should be read as a statement about any live system.",
    },
    {
      title: "Not a certification or formal penetration test",
      body: "This is a focused engineering review against a documented scenario set. It is not an attestation, an audit opinion, or a comprehensive security assessment, and it does not establish that no other issue exists.",
    },
    {
      title: "A documented fix is proven only for the documented check",
      body: "Where a check is shown as remediated, that is the same check, repeated, and constrained as expected. It is evidence for that check and its documented scope — not for the area as a whole, and not for variants that were never run.",
    },
    {
      title: "Point-in-time, and recorded rather than live",
      body: "The evidence is a recording of a real run against an isolated local fixture, not a query made when you opened this page. The recording time, engine, and fixture digest travel with every excerpt so a replay is never mistaken for a live result.",
    },
    {
      title: "Identity is simplified; authorization is not",
      body: "The fixture carries the acting member in a transaction-local setting rather than a signed token. The policies under test are ordinary PostgreSQL row level security and behave exactly as they would against a real identity source — only the source of the identity differs. The fixture is never exposed to a network and is not an application backend.",
    },
    {
      title: "Authorization is required before any live work",
      body: "Nothing here authorizes testing of any system. Work on a live system starts only after authorization and scope are documented and confirmed separately.",
    },
  ],
} as const;

export const NOT_TESTED = {
  heading: "What was not tested",
  body: "Two things are listed here rather than left to inference: operations in the coverage matrix that carry no documented check, and the areas each finding explicitly does not cover. An area that appears in neither list was still not necessarily examined — only the documented checks were run.",
} as const;

/**
 * The case study. It narrates THIS review — the one in this document — because
 * that is the only engagement whose outcome is evidenced here. It describes no
 * client, no real project, and no outcome beyond what the recorded runs show,
 * and it promises no timeline, price, finding, or result (MPS-RULE-005,
 * MPS-RULE-007, MPS-REQ-011).
 */
export const CASE_STUDY = {
  intro:
    "The case study is this document. Rather than describe an engagement you cannot inspect, the lab publishes a complete one end to end — the fixture, the checks, the failures, the fixes, the repeated checks, and the limits of what any of it proves.",
  steps: [
    {
      title: "A realistic project, built to be wrong in ordinary ways",
      body: "The fixture is a multi-tenant SaaS with tenants, roles, protected records, files, and inbound payment events. Its defects are the ordinary ones — an unconditional policy predicate, a grant without row level security, an idempotency key on the wrong identifier, a ledger write outside the transaction it protects. None was chosen to be dramatic.",
    },
    {
      title: "The checks were run, not reasoned about",
      body: "Two of the fixture's defects did not behave the way the first draft assumed, and the evidence corrected the assumption rather than the other way round. PostgreSQL reuses an UPDATE policy's USING expression as its check, and it tests an updated row against the SELECT policy too — so a widened write check alone does not escalate. Both are now in the remediation guidance because the run produced them.",
    },
    {
      title: "The fixes were applied and the same checks repeated",
      body: "Not similar checks, and not a description of a fix — the identical documented checks, re-run against the remediated configuration, with both runs recorded. Where the report shows a before and an after, those are two real runs of one check.",
    },
    {
      title: "What is still not known is stated",
      body: "Operations with no documented check are marked untested, and an untested check is never read as a result. Each finding carries what it does not cover. The lab is more useful for being explicit about its edges than it would be for appearing complete.",
    },
  ],
  closing:
    "That is the shape of a review of your project: documented checks, evidence kept rather than summarized, fixes verified by repeating the same check, and an honest account of the boundary around all of it.",
} as const;
