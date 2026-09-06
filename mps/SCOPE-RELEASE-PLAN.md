# Supabase SaaS Launch-Readiness Lab — Scope & Release Plan

Status: Approved  
MPS version: v1.0

## MVP — Release R1: Portfolio Launch-Readiness Proof

**Goal:** Demonstrate credible, reproducible launch-readiness expertise and convert qualified Upwork/portfolio visitors into authorized service conversations.

**Primary users:** SaaS founders/product owners.  
**Secondary users:** Agencies and development teams.  
**Release posture:** Public portfolio experience using synthetic data only.

### Included capabilities

| ID | Capability | MVP treatment |
|---|---|---|
| MPS-CAP-001 | Synthetic SaaS launch-risk demonstration | One coherent multi-tenant SaaS context with seeded vulnerable and remediated states |
| MPS-CAP-002 | Authorization and tenant-isolation verification | Role/tenant negative tests, RLS coverage matrix, storage-boundary example, configuration/secrets review example |
| MPS-CAP-003 | Payment and webhook-integrity verification | Replayable webhook scenario, duplicate-event risk, idempotency ledger proof |
| MPS-CAP-004 | Reliability and recovery verification | Representative retry, failure, timeout, duplicate, or recovery scenario |
| MPS-CAP-005 | Buyer-readable audit evidence | Scenario evidence, severity, impact, reproduction, remediation, before/after result, limitation |
| MPS-CAP-006 | Portfolio conversion path | Case-study narrative, service boundary, inquiry form or approved contact route |

### Explicit MVP exclusions

- Live scanning, penetration testing, or code review of a buyer’s application.
- Buyer uploads, production credentials, or application-specific evidence ingestion.
- Formal penetration-test report, certification, legal opinion, or compliance attestation.
- Authenticated client portal, project workspace, billing, scheduling, or contract management.
- Automated risk scoring that claims a buyer’s application is launch-ready without an authorized review.
- Broad vulnerability coverage unrelated to the selected launch-readiness pillars.

## R2 — Evidence Expansion

**Goal:** Increase proof depth and learning value after initial portfolio response.

Proposed additions: expanded scenario library, downloadable sample report, deeper deployment/configuration checks, observability evidence, and structured FAQ based on prospect objections. Promotion requires observed demand or a documented proof gap.

## R3 — Authorized Assessment Intake

**Goal:** Reduce manual intake work for real engagements while preserving authorization and data boundaries.

Proposed additions: authenticated client intake, evidence-upload controls, engagement workspace, scope approval, and report assembly. This release requires separate MPS decisions for customer data, retention, pricing, authorization, and deletion.

## Dependencies and launch conditions

- Buyer workflow and service boundary approved by MPS.
- MDS defines the proof, evidence, report, form, and responsive experience.
- MTS proves synthetic isolation, safe negative tests, secret/configuration hygiene, redacted telemetry, and recovery behavior.
- All findings are reproducible from documented synthetic fixtures.
- Every public claim states its limitation and does not imply certification or live-system testing.
- The complete buyer path works from entry through inquiry acknowledgement.
