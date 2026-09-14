# Supabase SaaS Launch-Readiness Lab — Reference Reconciliation

Status: Approved — Gate 5 complete  
MDS version: v0.1-draft  
Reviewed: 2026-09-05

## Authority

The written MDS state, approved proposals, token file, and approved MPS are authoritative. A generated visual becomes canonical only after Josh approves it at Gate 5. Illustrative prose, code, dates, row names, counts, and example test output inside a generated image do not create product requirements, performance targets, findings, or commercial claims.

## Reference review

| Reference | Result | Reconciliation performed | Remaining limitation |
|---|---|---|---|
| Core Design System v2 | Approved and canonical | Corrected typography captions to H1 44/52, H2 32/40, H3 24/32, body 16/26, small 14/22, label 13/18, and mono 13/21. Corrected radius captions to 6 px evidence/status cells, 10 px controls, and 14 px cards/panels. | Small example copy, code, timestamps, and matrix content are illustrative. Exact tokens and labels come from the written MDS. |
| Landing Page Desktop v1 | Approved and canonical | Removed an unsupported average-runtime claim and unqualified confidence language. Replaced the initial lightning-like mark with the approved boundary frame intersected by a verified check path. | Scenario counts and example findings are synthetic demonstration content, not buyer results or measured performance. |
| Component Library v2 | Approved and canonical | Replaced an unapproved workflow stepper with Context → Vulnerable proof → Remediation → Repeated test → Limitation. Removed scan language and numeric counts from generic finding-summary components. | Code, dates, matrix rows, and supporting sentences remain illustrative. |
| Layout and Responsive Behavior v1 | Approved and canonical | Confirmed desktop rail, tablet in-flow selector, mobile reading order, 4/2/1 card transformation, and labeled matrix overflow against approved composition rules. | Example lab-run dates and finding counts are illustrative only. |
| Scenario Index Desktop v2 | Approved and canonical | Corrected the Authorization card's initial state from red danger treatment to the neutral untested treatment. | Scenario descriptions are reference copy and may be refined without changing the approved information architecture. |
| Guided Authorization and RLS Desktop v2 | Approved and canonical | Replaced red X marks for not-applicable matrix cells and legend with the approved neutral minus treatment. | SQL, rows, timestamps, severity, and finding content are synthetic examples. |
| Sample Audit Report Desktop v1 | Approved and canonical | Confirmed explicit sample/synthetic/non-certification framing, severity hierarchy, evidence, remediation, repeated test, and limitation structure. | All counts, dates, findings, and evidence are illustrative—not measured results or promises. |
| Inquiry Desktop v1 | Approved and canonical | Confirmed persistent labels, no-secrets/no-production-data guidance, absence of upload/billing/scheduling, acknowledgement, and retryable failure state. | Form-field wording may be refined during specification without changing collected information or safety boundary. |
| Mobile Experience v4 | Approved and canonical | Rebuilt the board from approved references. Verified the information-circle privacy callout, synthetic scenario heading, approved five-step sequence, evidence-preserving order, limitations, recovery, report route, and CTA. | Example copy and evidence remain illustrative; exact behavior comes from written MDS state. |

## Checkpoint decision

All nine references are approved and canonical. Gate 5 is complete with no open reference gap. Gate 6 will establish the approved MDS release and proposed v1.0 activation state.

## R1 implementation reconciliation (MDS QA Gate 2, 2026-09-14)

Added after the R1 combined QA pass compared rendered output against these references (`mds/qa/MDS-QA-REPORT-R1.md` §4). Each entry records how a difference between a reference and the written MDS was resolved, by owner ruling. The Gate 5 record above is unchanged. Gate 2 sign-off itself is recorded in the QA report (§13), not here: Josh Coley approved the recaptured comparison on 2026-09-14, and MDS compliance is PASS WITH APPROVED EXCEPTIONS with MDS-EXC-001 the only exception.

| Finding | Reference | Difference | Owner ruling (Josh Coley, 2026-09-14) | Record |
|---|---|---|---|---|
| MDS-QA-R1-F004 | Landing Page Desktop v1; Scenario Index Desktop v2 | The boards draw the webhook-integrity and reliability-and-recovery pillar icons purple and orange; the approved palette had neither hue. | Approve the reference hues as tokens. `color.pillar.webhook` `#7C3AED` and `color.pillar.reliability` `#EA580C`, decorative and icon-only, never state, severity, action, or text. The other two pillars stay `color.brand.primary`. | MDS-CHG-006; `mds/tokens/tokens.json`; DESIGN-SYSTEM §4 |
| MDS-QA-R1-F005 | Sample Audit Report Desktop v1 | The board draws three columns (index, body, right sidebar with methodology, limitations, and CTA). COMPOSITION-PROPOSAL "Audit report shell" specifies a sticky section index beside the report, with method and limitations and the CTA as sections of the report. | The implemented two-column composition is authoritative for R1; the three-column board is not built. Consistent with the S4 owner decision recorded as MTS-OBS-028. | MDS-EXC-001 |
| MDS-QA-R1-F006 | Mobile Experience v4 | Panel 3 draws no synthetic context panel; the implementation places it between the scenario selector and the step summary. | Approve the implemented position. The written mobile order now names it. | DESIGN-SYSTEM §12; AGENTS.md; MDS-CHG-007 |
| MDS-QA-R1-F007 | Guided Authorization and RLS Desktop v2 | The board draws one before/after pair on the evidence canvas; the implementation renders every documented test pair (eleven in the remediated lab). | Accept the fully expanded canvas for R1: evidence completeness outranks the board's single-screen density, and documented test pairs are not hidden to shorten the page. No collapsing, pagination, or representative-only evidence in R1. Improved evidence navigation, grouping, or summarization is an R2 investigation candidate. | MDS-CHG-007 |
