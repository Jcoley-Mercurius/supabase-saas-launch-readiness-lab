# MPS QA Protocol

Status: Current protocol; execution awaits implementation  
MPS version: v1.1

## Evidence required

- Requirement-to-workflow-to-acceptance traceability for MPS-REQ-001–015.
- Demonstrated main, alternate, unavailable, failure, retry, duplicate, and unauthorized-request paths.
- Proof that the public lab uses synthetic data and no production credential, buyer upload, secret, or customer record.
- Proof that vulnerable, remediated, untested, and unavailable states are distinguishable.
- Proof that claims, inquiry acknowledgements, and retention behavior respect MPS-RULE-001–008.
- Proof that inquiry content is removed at the 12-month limit or earlier manual deletion and that any retained deduplication metadata is minimal.
- Proof that the CTA is reachable from individual scenarios and the report without account creation.
- Measurement-readiness evidence for MPS-MET-001–005 without sensitive-data collection or inflated duplicate demand.
- MDS QA for responsive, interaction, accessibility, and visual quality.
- MTS QA for tenancy, authorization, test integrity, secrets, webhook idempotency, telemetry, delivery, and recovery.

Results: PASS, PASS WITH APPROVED EXCEPTIONS, REVIEW REQUIRED, or FAIL. Implementation QA cannot claim market validation, certification, compliance, or achieved conversion outcomes.
