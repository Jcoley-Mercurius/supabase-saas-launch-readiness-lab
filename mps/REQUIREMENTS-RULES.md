# Supabase SaaS Launch-Readiness Lab — Requirements & Rules

Status: Approved  
MPS version: v1.1

## Product requirements

| ID | Requirement | Priority | Release |
|---|---|---|---|
| MPS-REQ-001 | The lab shall explain its target buyer, launch-readiness purpose, covered risk areas, and service limitations before or alongside interactive proof. | must | R1 |
| MPS-REQ-002 | The lab shall present one coherent synthetic multi-tenant SaaS context with identifiable tenants, roles, protected resources, and payment/webhook events. | must | R1 |
| MPS-REQ-003 | A buyer shall be able to inspect a representative unauthorized-access or cross-tenant failure without supplying real credentials or data. | must | R1 |
| MPS-REQ-004 | The lab shall show the associated RLS/authorization boundary and a reproducible negative-test result in buyer-readable language. | must | R1 |
| MPS-REQ-005 | The lab shall demonstrate a storage or configuration/secrets boundary risk and clearly state what was and was not tested. | must | R1 |
| MPS-REQ-006 | The lab shall demonstrate webhook replay or duplicate-delivery risk and the remediated idempotency result. | must | R1 |
| MPS-REQ-007 | The lab shall demonstrate at least one reliability or recovery scenario with an explicit failure and recovery result. | must | R1 |
| MPS-REQ-008 | Each finding shall include severity, affected boundary, reproduction evidence, impact, remediation direction, before/after status, and limitation. | must | R1 |
| MPS-REQ-009 | The buyer shall be able to navigate from any scenario to the complete report/case study and authorized-engagement CTA. | must | R1 |
| MPS-REQ-010 | The buyer shall be able to submit an inquiry containing role, stack, launch trigger, desired review, contact method, and authorization status. | should | R1 |
| MPS-REQ-011 | The system shall acknowledge an inquiry only after successful submission and shall not promise a response time, price, or outcome. | must | R1 |
| MPS-REQ-012 | The system shall provide recoverable states for unavailable demonstrations, failed scenario loading, failed inquiry submission, and duplicate submission. | must | R1 |
| MPS-REQ-013 | The lab shall not require or expose production credentials, customer data, secrets, or buyer application uploads in R1. | must | R1 |
| MPS-REQ-014 | The experience shall communicate that live-system work requires documented authorization and separately confirmed scope. | must | R1 |
| MPS-REQ-015 | The system shall retain inquiry records for no more than 12 months after latest activity, permit earlier manual deletion, and retain only minimal operational deduplication metadata afterward when necessary. | must | R1 |

## Business rules

| ID | Rule |
|---|---|
| MPS-RULE-001 | Synthetic or explicitly authorized data only. |
| MPS-RULE-002 | Vulnerable, remediated, and untested states must never be presented as interchangeable. |
| MPS-RULE-003 | A demonstration does not authorize testing of any third-party system. |
| MPS-RULE-004 | R1 has no buyer upload or production-credential path. |
| MPS-RULE-005 | Inquiry acknowledgement is not an engagement acceptance or launch-readiness guarantee. |
| MPS-RULE-006 | A duplicate inquiry must not create a duplicate engagement or misrepresent demand. |
| MPS-RULE-007 | A claim of “fixed,” “passed,” or “launch-ready” applies only to the documented synthetic scenario or explicitly scoped authorized test. |
| MPS-RULE-008 | Inquiry records are retained for no more than 12 months after latest activity, may be manually deleted earlier, and may leave only minimal operational deduplication metadata afterward. |
