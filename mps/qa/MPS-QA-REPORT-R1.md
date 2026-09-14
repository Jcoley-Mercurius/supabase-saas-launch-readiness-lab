# Supabase SaaS Launch-Readiness Lab — MPS QA Record (R1)

Protocol: `mps/qa/MPS-QA.md`
Status: **PASS**
MPS version: v1.1
Date: 2026-09-10
Recorded by: Claude (agent execution)

> Implementation QA cannot claim market validation, certification, compliance, or
> achieved conversion outcomes, and nothing below does.

## Environment

Production build (`pnpm build && pnpm start`) at commit `55b9357` plus this
slice's QA additions, on Ubuntu 26.04 / Node v24.17.0 / Next.js 16.3.4, verified
with Playwright 1.63.0 across Chromium at four approved viewports and Firefox at
desktop. Synthetic fixture only; no hosted database and no inquiry row was
written by any check recorded here.

## Evidence required by the protocol

### Requirement-to-workflow-to-acceptance traceability, MPS-REQ-001–015

Every slice traces its work to requirement, rule, and acceptance IDs in its own
suite header, and the acceptance table below records where each criterion is
proved. Traceability is carried in the code rather than in a separate index, so
it cannot drift from what actually runs.

### Acceptance criteria

| ID | Where it is proved | Result |
|---|---|---|
| MPS-ACC-001 | `e2e/s1-shell.spec.ts` — purpose, risk areas, synthetic boundary, and non-certification limitation stated on the entry routes | Pass |
| MPS-ACC-002 | `e2e/s1`, `e2e/s2` — synthetic SaaS context panel; tenants, roles, protected resources, and payment events without production data | Pass |
| MPS-ACC-003 | `e2e/s2-evidence.spec.ts` — the vulnerable run reproduces the cross-tenant read with evidence, affected boundary, and plain-language impact | Pass |
| MPS-ACC-004 | `e2e/s2-evidence.spec.ts` — the repeated documented test is blocked, the before panel survives, and the limitation is adjacent | Pass |
| MPS-ACC-005 | `e2e/s2-evidence.spec.ts` — all sixteen matrix cells classified with a reason; no absent check reads as a pass | Pass |
| MPS-ACC-006 | `e2e/s2-evidence.spec.ts` — storage and configuration boundary proved with no real secret exposed | Pass |
| MPS-ACC-007 | `e2e/s3-replay.spec.ts`, `tests/unit/replay-executor.spec.ts` — the same logical event replayed creates no duplicate commitment | Pass |
| MPS-ACC-008 | `e2e/s3-replay.spec.ts` — failure, retry, recovered, and unavailable states with preserved context and a return route | Pass |
| MPS-ACC-009 | `e2e/s4-report.spec.ts`, `tests/unit/report-model.spec.ts` — severity, reproduction, impact, remediation, before/after, limitation on every finding | Pass |
| MPS-ACC-010 | `e2e/s1-shell.spec.ts` — the report and the CTA are reachable from every route, without completing a scenario and without an account | Pass |
| MPS-ACC-011 | `e2e/s5-inquiry.spec.ts` — acknowledgement confirms receipt and states it is not an accepted engagement and carries no timeline, price, or outcome | Pass — after a defect found and fixed in this pass: focus did not reliably move to the acknowledgement (MTS-OBS-053) |
| MPS-ACC-012 | `e2e/s5-inquiry.spec.ts`, `tests/unit/inquiry-submission.spec.ts` — unconfirmed submission, retry, and duplicate are distinct; a duplicate links to the original and does not imply a second engagement | Pass |
| MPS-ACC-013 | `e2e/s5-inquiry.spec.ts` — an inquiry naming a system the sender cannot authorize stops at the boundary and explains that authorization and scope come first | Pass |
| MPS-ACC-014 | `e2e/s2`, `e2e/s3` — unavailable evidence is labelled unavailable rather than passed, context is preserved, and recovery is offered | Pass |
| MPS-ACC-015 | `tests/unit/inquiry-boundary.spec.ts`, `e2e/s2-evidence.spec.ts`, `e2e/qa-gate1.spec.ts` — no production credential, customer record, raw secret, or upload is required or exposed | Pass |
| MPS-ACC-016 | `supabase/inquiry/tests/`, `scripts/retain-inquiries.mjs`, `.github/workflows/retention.yml` — 12-month redaction and earlier manual deletion, leaving bounded deduplication metadata | Pass — automation verified; see limitation below |

### Demonstrated paths

Main, alternate, unavailable, failure, retry, duplicate, and unauthorized-request
paths are all exercised. The eight required inquiry states and the seven canonical
evidence states are exercised in the browser at the approved viewports.

### Synthetic data and no production exposure

The lab makes no request to any database or third-party host from the browser
(`e2e/s2`). The evidence engine holds no database client, driver, or connection,
and imports nothing from the inquiry path; the inquiry path imports nothing from
the evidence engine; measurement can reach neither (`tests/unit/inquiry-boundary.spec.ts`).
Exactly one module constructs a database client, and only two modules read a
credential from the environment. No service-role key is read anywhere. No
credential-shaped literal exists in the repository — every example value is
assembled at runtime (MTS-OBS-046).

### Distinguishable states

Vulnerable, remediated, untested, and unavailable each carry a distinct canonical
label, a distinct shape, an explanation, and a semantic colour, from a single
source (`components/ui/status-indicator.tsx`). MDS QA Gate 1 verified that the
meaning survives with colour and imagery removed.

### Claims, acknowledgements, and retention behaviour — MPS-RULE-001–008

"Secure", "certified", "compliant", "guaranteed", and unqualified "passed" appear
nowhere in source or in rendered text on any route. Acknowledgement promises
nothing. A duplicate does not create or imply a second engagement. Fixed and
launch-ready language is scoped to the documented synthetic scenario throughout.

### Retention — MPS-REQ-015

`redact_expired_inquiries()` removes inquiry content past 12 months of latest
activity and `redact_inquiry()` performs earlier manual deletion, leaving only
bounded deduplication metadata. Both are driven by `pnpm inquiries:retain` and
scheduled monthly (`.github/workflows/retention.yml`, `0 4 1 * *`, schedule and
manual dispatch only). A privilege defect that would have let `anon` execute both
functions was found and fixed on the hosted project (MTS-OBS-044), and the
retention guard defect that would have failed every scheduled run was found and
fixed before it could (MTS-OBS-045).

**Limitation, stated rather than glossed:** the retention *mechanism* is verified
— locally, on the hosted project, and by its own SQL assertions. What has not yet
happened is a real record ageing past 12 months, because no record is that old.
The first genuine expiry cannot be observed before 2027.

### CTA reachability without an account

Proved from every route including the report and each individual scenario
(`e2e/s1-shell.spec.ts`). No account, sign-in, or upload exists anywhere in R1.

### Measurement readiness — MPS-MET-001–005

Every declared event has an emitter, and the database's own check constraint is
the authority on the taxonomy — an unapplied migration now fails the release gate
rather than silently zeroing a metric (MTS-OBS-052, closed). The payload has no
field that could hold free text or an identifier, and no credential, session,
cookie, or address is read anywhere in measurement
(`tests/unit/measurement-boundary.spec.ts`).

A duplicate inquiry is counted as a duplicate and does not inflate demand. No
row identifies a person, so any conversion figure derived from these events is a
ratio between event totals over a period and must be described as one — the
landing emitter says so in its own comment.

### MDS QA and MTS QA

- MDS: `mds/qa/MDS-QA-REPORT-R1.md` — Gate 1 PASS, Gate 3 PASS, Gate 2 review required (owner sign-off).
- MTS: `mts/qa/MTS-QA-REPORT-R1.md` — required automated checks pass; two manual owner checks outstanding.

## Result

**PASS.**

This records product acceptance for R1. It does not establish market demand,
formal security certification, legal compliance, or a real-world outcome, and no
result above should be read as any of those.

Two things remain outside this record and are tracked where they belong: the
Gate 2 visual sign-off (MDS), and the preview-environment separation
(MTS-DEV-003). Neither affects any acceptance criterion above.
