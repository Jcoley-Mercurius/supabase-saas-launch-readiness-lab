# Supabase SaaS Launch-Readiness Lab — Acceptance Criteria

Status: Approved  
MPS version: v1.1

## R1 product acceptance

| ID | Given / When / Then |
|---|---|
| MPS-ACC-001 | Given a first-time buyer enters the lab, when the experience loads, then the buyer can identify the purpose, target users, covered risk areas, synthetic-data boundary, and non-certification limitation. |
| MPS-ACC-002 | Given the buyer selects the synthetic SaaS context, when the context opens, then tenants, roles, protected resources, and payment/webhook examples are understandable without private or production data. |
| MPS-ACC-003 | Given the buyer opens the authorization scenario, when the negative test is run or revealed, then the buyer sees the unauthorized/cross-tenant result, affected boundary, and plain-language impact. |
| MPS-ACC-004 | Given the buyer views the authorization finding, when the remediated state is selected, then the same representative negative test is shown as blocked or otherwise correctly constrained, with the limitation that this proves only the documented scenario. |
| MPS-ACC-005 | Given the buyer opens the RLS coverage matrix, when the matrix is reviewed, then each displayed check is classified as passing, failing, not tested, or not applicable, and no missing check is implied to have passed. |
| MPS-ACC-006 | Given the buyer opens the storage/configuration scenario, when the evidence is displayed, then the boundary risk, remediation direction, and secret/data-handling limitation are visible without exposing a real secret. |
| MPS-ACC-007 | Given a webhook event is replayed or duplicated in the synthetic scenario, when the remediated path is evaluated, then the evidence shows that the same logical event does not create a duplicate commitment or payment-state transition. |
| MPS-ACC-008 | Given a reliability scenario encounters failure, timeout, retry, or duplicate delivery, when recovery is completed, then the final state and recovery limitation are visible and the buyer can return to the scenario index. |
| MPS-ACC-009 | Given the buyer opens any finding, when the evidence panel/report is viewed, then severity, reproduction, impact, remediation, before/after status, and limitation are present. |
| MPS-ACC-010 | Given the buyer is evaluating fit, when the case study or report is opened, then the buyer can reach the authorized-engagement CTA without completing every scenario or creating an account. |
| MPS-ACC-011 | Given the buyer submits an inquiry with required fields, when submission succeeds, then the system confirms receipt and records no promise of timeline, price, certification, or result. |
| MPS-ACC-012 | Given inquiry submission fails or is repeated, when the buyer retries, then the experience clearly distinguishes unconfirmed submission from acknowledged submission and does not imply duplicate engagements. |
| MPS-ACC-013 | Given a buyer requests live testing without confirmed authorization, when the request is reviewed, then the workflow stops at the inquiry boundary and explains that authorization and scope must be established first. |
| MPS-ACC-014 | Given a scenario or report is unavailable, when the buyer encounters the unavailable state, then the experience preserves context, labels the evidence as unavailable rather than passed, and offers recovery or an alternate route. |
| MPS-ACC-015 | Given the public R1 experience is tested, when data, logs, or telemetry are inspected, then no production credential, real customer record, raw secret, or buyer application upload is required or exposed. |
| MPS-ACC-016 | Given an inquiry record reaches 12 months after its latest activity or is manually deleted earlier, when retention processing completes, then the inquiry content is removed and only minimal operational deduplication metadata remains when necessary. |

## Acceptance boundary

These criteria establish product acceptance. They do not by themselves prove market demand, formal security certification, legal compliance, or real-world outcome improvement. MDS must validate experience and accessibility; MTS must validate technical isolation, test integrity, secret handling, and operational recovery.
