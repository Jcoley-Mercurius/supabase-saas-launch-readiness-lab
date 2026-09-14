# MPS Product Implementation Input

Status: Approved MPS input; implemented\
MPS version: v1.1

## Implementation status (reconciled 2026-09-14)

All six slices below are implemented, merged to `main` (fcb30f5), and served by the production deployment at <https://supabase-saas-launch-readiness-lab.vercel.app/>. MTS reconciled them into P0 and S1–S6 (`mts/IMPLEMENTATION-PLAN.md`, `mts/MERCURIUS-BUILD-ROADMAP.md`). Product acceptance is recorded in `mps/qa/MPS-QA-REPORT-R1.md`: MPS-ACC-001 through MPS-ACC-016 pass. Formal S6 release approval and closing the MPS product-validation gate remain owner decisions. The owner decisions of 2026-09-14 (MPS-DEC-008 through MPS-DEC-013) apply to the later portfolio-polish slice, not to the R1 scope below.

## Proposed user-visible slices

| Slice | Product outcome | Primary IDs | Completion gate |
|---|---|---|---|
| 1. Public positioning and guided entry | Buyer understands purpose, risks, boundaries, and next steps | REQ-001–002; ACC-001–002 | Clear public context using synthetic data |
| 2. Authorization and RLS proof | Buyer sees cross-tenant failure and remediated negative test | REQ-003–004; ACC-003–005 | Evidence states remain explicit |
| 3. Storage and configuration proof | Buyer understands boundary risk without exposed secrets | REQ-005, 013; ACC-006, 015 | No real secret or production data required |
| 4. Webhook integrity proof | Buyer sees replay risk and idempotent outcome | REQ-006; ACC-007 | Duplicate logical event cannot create duplicate commitment |
| 5. Reliability and recovery proof | Buyer sees failure and truthful recovery | REQ-007, 012; ACC-008, 014 | Recovery and unavailable states are navigable |
| 6. Report, case study, and inquiry | Buyer evaluates fit and submits an authorized-service inquiry | REQ-008–015; ACC-009–016 | Acknowledgement remains distinct from engagement acceptance and inquiry retention is enforceable |

MTS reconciled this product sequence with technical dependencies before implementation (the historical instruction this line carried). Repository paths are recorded by MTS and MDS, not here.

## Engineering capability signals for MTS

- Synthetic multi-tenant fixtures with deterministic roles and protected resources.
- Negative authorization and RLS verification with reproducible evidence.
- Safe simulated configuration/secret findings and redacted logs.
- Deterministic webhook replay, deduplication, and idempotency evidence.
- Failure injection, retry/recovery handling, and truthful unavailable states.
- Inquiry delivery, deduplication, privacy-aware storage, abuse resistance, and recovery.
- Privacy-safe analytics for the approved metric definitions.

Every slice must trace to requirement, rule, and acceptance IDs; pass MPS acceptance; satisfy applicable MDS visual/accessibility gates; and satisfy MTS security, integrity, reliability, and operations verification.
