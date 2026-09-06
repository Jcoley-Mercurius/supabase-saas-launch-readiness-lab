# Supabase SaaS Launch-Readiness Lab — Buyer Workflow Catalog

Status: Approved  
MPS version: v1.1  
Canonical source: `mps/MPS-PROJECT-STATE.yaml`

## WFL-001 — Discover proof and request an authorized engagement

**Goal:** Help a prospective founder or agency determine whether Josh’s launch-readiness service is relevant and take a safe next step.

**Actors:**

- Primary: SaaS founder/product owner
- Secondary: agency/development team
- Operator: Josh/auditor
- Affected reviewer: Upwork prospect or portfolio reviewer

**Trigger:** Buyer arrives from Upwork, portfolio, referral, or direct link.

**Preconditions:** The public proof experience is available. No buyer application data or production credentials are required for the MVP.

### States

`discovered → reviewing → exploring-proof → evaluating-fit → inquiry-started → inquiry-received → manually-qualified → authorized-scope → engaged`

Alternate terminal states: `not-a-fit`, `abandoned`, `contact-failed`, `blocked-unauthorized-request`.

### Main path

1. Buyer sees the service purpose, target problems, and explicit boundary: launch-readiness review and remediation, not formal certification or an unauthorized penetration test.
2. Buyer selects a guided scenario or follows the recommended sequence.
3. Buyer views the synthetic SaaS context and the affected user/tenant boundary.
4. Buyer observes an intentionally vulnerable behavior through a safe, preconfigured demonstration.
5. Buyer reviews the impact in plain language, the reproducible test evidence, and the affected launch risk.
6. Buyer switches to or opens the remediated behavior and verifies the negative test no longer succeeds.
7. Buyer reviews the severity-ranked finding and recommended remediation pattern.
8. Buyer repeats representative scenarios for authorization/RLS, storage/configuration, Stripe webhook integrity, and reliability/recovery.
9. Buyer reviews the sample report/case study and chooses the authorized-engagement CTA.
10. Buyer submits a contact request with role, stack, launch trigger, review needs, and confirmation that testing would be authorized.
11. The system confirms receipt without promising a response time or audit result.
12. Josh manually qualifies the request, confirms scope and authorization, and creates a separate engagement boundary before any live-system work.

### Alternate paths

- **Agency path:** Buyer identifies the work as client-facing and requests a review/remediation conversation; the system does not assume the agency has authority over the client’s system.
- **Report-first path:** Buyer reviews the sample report without running every scenario and can still reach the CTA.
- **Single-scenario path:** Buyer enters through one concern such as RLS or webhook replay and can return to the full scenario index.
- **No-contact path:** Buyer may leave after reviewing proof; no account is required.

### Failure, timeout, cancellation, and recovery

- If a demonstration is unavailable, preserve the scenario context and show a recoverable unavailable state; do not claim the control passed.
- If a scenario fails to load, allow retry and return to the scenario index without losing the buyer’s position.
- If contact submission fails, retain entered fields only as long as the approved form flow permits, explain that no request was confirmed, and offer a retry or alternate contact route.
- If a buyer asks to test a live system without documented authorization, stop at the inquiry boundary and explain that authorization and scope must be confirmed first.
- If a buyer submits duplicate contact requests, the operator may consolidate them; the MVP must not imply multiple engagements were created.
- Inquiry content is removed no later than 12 months after latest activity or earlier through manual deletion; only minimal operational deduplication metadata may remain afterward when necessary.

### Completion and ownership

The public workflow is complete when the buyer has either reviewed the proof and exited, or submitted an acknowledged inquiry. Live testing begins only after Josh confirms authorization, scope, data handling, and engagement terms outside this MVP.

### Product rules

- `MPS-RULE-001`: All demonstrations use synthetic or explicitly authorized data.
- `MPS-RULE-002`: The lab must distinguish vulnerable, remediated, untested, and unavailable behavior.
- `MPS-RULE-003`: A portfolio demonstration never creates permission to test a buyer’s live system.
- `MPS-RULE-004`: No production credentials, secrets, customer records, or uploaded application data are required for the MVP.
- `MPS-RULE-005`: The CTA requests an authorized conversation; it does not guarantee a finding, timeline, price, or launch outcome.
- `MPS-RULE-008`: Inquiry retention is limited to 12 months after latest activity, with earlier manual deletion and minimal operational deduplication metadata afterward when necessary.

### Downstream dependencies

- MDS: public proof layout, scenario navigation, evidence states, report presentation, form states, accessibility, and responsive behavior.
- MTS: synthetic data isolation, safe demonstration boundaries, negative-test execution, form handling, secret hygiene, logging/redaction, and recovery behavior.
