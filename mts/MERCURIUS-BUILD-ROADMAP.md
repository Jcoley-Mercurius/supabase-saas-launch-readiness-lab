# Mercurius Build Roadmap — Supabase SaaS Launch-Readiness Lab

Status: Gate 7 implementation-readiness draft
Consumed: MPS v1.1 → MDS v1.0 → MTS v0.6-draft
Classification: greenfield
Current phase: S6 combined QA and release
Current slice: S6 — merged to `main` as `fcb30f5` (PR #13, 2026-09-14); R1 closeout reconciliation in progress on `chore/r1-closeout`; awaiting the owner S6 checkpoint
Readiness (reconciled 2026-09-14): P0 through S5 verified and approved; S6 implemented, merged, and deployed to production, with its combined MPS/MDS/MTS QA recorded (`mps/qa/MPS-QA-REPORT-R1.md` PASS, `mds/qa/MDS-QA-REPORT-R1.md` REVIEW REQUIRED pending Gate 2 sign-off, `mts/qa/MTS-QA-REPORT-R1.md` PASS WITH OPEN OWNER ACTIONS). The S5 history follows. S5 merged to `main` as `c3515f8` (PR #8) and the post-merge `verify` run went green on all three jobs. The whole inquiry path — store, deduplication, credential guard, authorization boundary, and notification — was proved against the real isolated project with a real submission and a real email, and one hosted-only privilege defect was found and fixed in the process (`MTS-OBS-044`). All thirteen checkpoint observations are ruled on and none remains open. The retention workflow has now run for real: its first dispatch reported 0 records due and 0 redacted, printing counts and no content.

## Approved route

P0 Bootstrap → S1 Public Shell → S2 Evidence/RLS → S3 Replay/Recovery → S4 Report → S5 Inquiry → S6 Combined QA/Release

## Owner prerequisites

Create the standalone Git repository, Vercel project, isolated Supabase environments, verified Resend domain, and private environment values. These actions are not silently performed by the coding agent.

Status as of 2026-09-14: the repository, the Vercel project (connected 2026-09-09), the dedicated hosted inquiry project, and the private environment values are in place, and production delivery of the inquiry notification was verified on 2026-09-09 (`MTS-OBS-049`). Still owner-gated: confirming the Vercel variable scopes (Supabase and Resend values in Production only), confirmation of whether the production sender is a verified domain, and edge request rate limiting (`MTS-OBS-037`). A second Supabase project for preview is no longer required: Preview is non-writing in code under `MTS-EXC-003` (2026-09-14), which resolves `MTS-DEV-003`.

Historical status as of 2026-09-08: the repository, the isolated Supabase environments (local fixture plus the dedicated hosted inquiry project), and the private environment values are all in place. Two remain, both S6 and both owner-gated: the **Vercel project**, which blocks preview and production deployment, and a **verified Resend from-domain for production** plus a preview destination that cannot deliver to a real buyer. Neither blocked S5 — a real notification was sent and accepted on 2026-09-08.

## Phase route

| Phase | Agent produces | User owns | Verification/checkpoint |
|---|---|---|---|
| P0 | initialized app, canonical package, skill checks, scripts, baseline branch | repository/account setup and private values | artifact inventory and clean baseline |
| S1 | MDS tokens, shell, navigation, scenario entry, shared states | review local/preview visual direction | lint, typecheck, build, responsive/keyboard smoke |
| S2 | synthetic fixtures, bounded executor, RLS matrix/tests | confirm evidence wording if a new state appears | deterministic reruns, allow/deny, reset safety |
| S3 | replay ledger, failure injection, retry/recovery UI | review truthful limitations | duplicate/retry/unavailable/recovery evidence |
| S4 | report, case study, print route, CTA | review buyer-facing claims | traceability, print/responsive/a11y checks |
| S5 | inquiry route/store/notification/dedupe/retention | configure notification destination and approve preview test | privacy, validation, duplicate, failure, delivery evidence |
| S6 | measurement boundary, full QA, CI gate (`pnpm evidence:verify` on a PostgreSQL service, plus WebKit), preview release, rollback record | approve production promotion | combined MPS/MDS/MTS evidence and owner release gate |

## Required skills

The current manifest is mts/AGENT-SKILL-MANIFEST.yaml. Required skills are MTS methodology, framework guidance, and browser verification. Official documentation plus project AGENTS.md are approved fallbacks when an equivalent coding-agent skill is unavailable; missing required skills without that fallback block the dependent slice.

## Slice status

| Slice | Status | Evidence |
|---|---|---|
| P0 | verified | Clean baseline, canonical package, environment contract, skill fallbacks recorded |
| S1 | approved | Merged to `main` as `f3d18d3` |
| S2 | approved | Owner approved S2 on 2026-09-07; merged to `main` as `6774608` |
| S3 | approved | `pnpm check` green from a deleted `.next`; `pnpm evidence:verify` green against a live database (8/8 steps — both transcripts reproduced byte for byte from a clean database, twice); 12 SQL fixture-safety checks; 79 unit tests; 405 Playwright checks against a build confirmed to contain the change under test (324 chromium desktop/wide/tablet/mobile at 8 workers, 0 failed and 0 flaky; 81 firefox-desktop at 1 worker); WebKit remains CI-only under MTS-EXC-002 |
| S4 | approved | Merged to `main` as `ff89b28`. Owner approved `MTS-OBS-028`–`033` (`MTS-CHG-010`) and confirmed `MDS-GAP-S4-001` (`MDS-CHG-003`) on 2026-09-07.  `pnpm check` green from a deleted `.next` (91 unit tests, including 12 that recompute every published report count straight from the transcript JSON); 500 Playwright checks across five projects at 1 worker — 500 passed, 0 failed, 0 flaky, in 8.1 minutes against a production build the suite built and served itself; three of those checks run in the print medium itself; WebKit remains CI-only under MTS-EXC-002 |
| S5 | approved | Merged to `main` as `c3515f8`; post-merge `verify` green on all three jobs (run 34277038707). 12 SQL inquiry checks green against a real database (authorization deny paths, RLS, isolation, accept, duplicate, abuse control, delivery metadata, retention, manual deletion, credential patterns); 125 unit tests green, 34 of them new (33 at implementation plus the duplicate follow-up-alert test added by the `MTS-OBS-038` ruling), including 8 that walk the static import graph to enforce the `MTS-RISK-001` residual; 23 new browser checks per project covering all eight approved inquiry states, the responsive transformation, keyboard order, focus, contrast, and the route boundary; `pnpm check` green from a deleted `.next`. The Resend delivery half was then proved with a real message sent and accepted, closing `MTS-OBS-042`, and `.github/workflows/retention.yml` was dispatched and observed green (run 34277980502), closing `MTS-OBS-039` |
| S6 | merged — awaiting owner checkpoint | Merged to `main` as `fcb30f5` (PR #13, 2026-09-14) after PRs #10, #11 and #12; post-merge `verify` run 34852162894 green on all three jobs (1,084 browser checks passed, 2 skipped, 0 failed, 0 flaky, WebKit included; 151 unit tests passed, 1 skipped); Vercel production deployed `fcb30f5` and was confirmed serving it. Delivered: MDS Gate 2 fidelity (`MDS-CHG-004`, `-005`), the CI gate hardening and response security headers (`MTS-OBS-047`, `-048`), the first-party measurement boundary (`MTS-DEC-016`, `MTS-CHG-019`–`021`), the landing migration applied and made a reviewed script (`MTS-OBS-052`, `MTS-CHG-022`), the production inquiry path verified (`MTS-OBS-049`), the combined QA pass and the acknowledgement-focus fix (`MTS-OBS-053`), and the pillar-hue tokens (`MDS-CHG-006`). Earlier blockers — the measurement provider decision and CI red on `main` — are both resolved. Open at the checkpoint: see Next action |

Open S1 items carried into the S2 checkpoint are MTS-DEV-001, MTS-DEV-002 (now partially resolved), and MTS-OBS-001 through MTS-OBS-004. **Both MDS gaps are closed**: `MDS-GAP-S1-001` by the approved `color.border.control` token and `MDS-GAP-S1-002` by applying the COMPONENTS-PROPOSAL evidence-state shapes, together recorded as `MDS-CHG-001`.

**All S2 checkpoint items are closed.** `MTS-OBS-005` is decided (`MTS-DEC-008`); `MTS-OBS-006`, `-007` and `-008` are confirmed; `MTS-OBS-009` through `-015` are acknowledged by the owner on 2026-09-07; `MTS-OBS-016` is resolved by the CI gate; `MTS-OBS-017` and `-018` are recorded and resolved. `MTS-DEC-009` (GitHub Actions) is approved.

Two items stay live by design rather than closing with their observation:

- **`MTS-OBS-011`** — the fixture simplifies identity, not authorization, so it must never be exposed to a public network or reused as an application backend. This is the technical floor under the recorded-evidence posture and the first thing to revisit if R2/R3 reconsiders live capability.
- **`MTS-RISK-001` residual — now addressed, with a new residual.** S5 added the runtime database client the residual predicted and confined it: `lib/inquiry/store.ts` is the only module that constructs one, it carries the `server-only` guard, it reads the publishable key and never a service-role key, and it reaches no table at all — every privilege on both inquiry tables is revoked and RLS is on with no policy, so its whole reach is two `SECURITY DEFINER` functions that take scalars and return no inquiry content. The separation is enforced rather than asserted: `tests/unit/inquiry-boundary.spec.ts` walks the static import graph of `lib/evidence` and `lib/inquiry` and fails if either reaches the other, if the evidence engine acquires a client or a connection string, if a credential is read outside the two approved modules, or if a second module constructs a client. The new residual is that the control now depends on that test staying in the check chain.

**MTS-OBS-005 is decided.** On 2026-09-06 the owner confirmed recorded-and-disclosed as the R1 evidence posture: the lab presents recorded evidence from an isolated local fixture rather than a live query, discloses that in every panel caption and limitation, and adds no live scanning. A buyer wanting a live audit is handled through the inquiry path as a paid engagement outside the public product. Live capability is deferred to R2/R3, where it would be an MPS scope change and an MTS re-gate. Recorded as `MTS-DEC-008`; the two approved additions are implemented under `MTS-CHG-005` (transcript freshness gate, buyer-visible reproducibility statement) and the new risk `MTS-RISK-006` is controlled.

S2 opened no MDS gap. **S3 opens no MDS gap**: the delivery ledger is the approved matrix/table component applied to a delivery sequence, and every state it shows is the canonical evidence vocabulary.

## Local database

S2 introduced `supabase/`; S3 adds two migrations and a second documented set (`supabase/tests/documented-sequences.sql`). `pnpm db:start` runs the database container only, on ports moved out of the CLI default range so the lab cannot collide with another local Supabase project. `pnpm evidence:record` re-records the transcript; `pnpm evidence:verify` proves the committed transcript still reproduces. None of this is needed to run or build the application — the deployed lab holds no database connection.

`pnpm evidence:check` is the half of that verification which needs no database: it recomputes the fixture digest from `supabase/migrations`, `supabase/tests/documented-tests.sql` and `supabase/tests/documented-sequences.sql` and fails if the committed transcript no longer matches, so an edited fixture cannot leave a stale transcript being replayed to buyers. One digest covers both transcripts, because both come out of the same recorder run against the same fixture. It runs inside `pnpm check` and `pnpm test:unit`, and is the first step of `pnpm evidence:verify`. `pnpm check` is the ordinary check chain: `format:check`, `lint`, `typecheck`, `evidence:check`, `test:unit`, `build`.

## S3 evidence model

S3 follows the S2 recorded-and-disclosed posture (`MTS-DEC-008`) rather than introducing a live endpoint. **The lab publishes no webhook endpoint and accepts no event body from anyone.** The fixture gains a synthetic delivery set, an idempotency ledger, a payment-commitment table, and one handler whose behaviour is driven by a four-field configuration row, so the "before/after" a buyer sees is the row the handler actually branched on.

A replay claim cannot be made by one statement, so the unit of S3 evidence is a **documented sequence**: an ordered set of deliveries with a numeric end state — how many commitments exist and how much was applied — checked at the end and at named per-step checkpoints. The checkpoints exist because an end-state count alone can be met by accident: in `REL-003` the vulnerable handler loses the retry AND double-counts the later replay, and the two errors cancel. Without a checkpoint on the recovery step, a broken handler would have been published as remediated.

Eight sequences run under both configurations. Under the remediated handler all eight reach their required end state; under the vulnerable handler six do not, and the two that do are the legitimate allow paths — which is what shows the vulnerable configuration is a specific defect rather than a blanket failure.

## S4 report model

The report is **derived, not authored**, and the split is enforced by module rather than by convention. `lib/evidence/report.ts` reads every count, state, before/after status, matrix cell, date, and reproduction excerpt from the two committed transcripts. `lib/content/report.ts` holds framing only and contains no result, count, severity, state, or date. If a fact is not in a catalog or a transcript, it cannot appear in the report.

The published numbers, all derived: **4 findings**, every one High severity; **24 documented checks** per configuration, of which **18 did not meet their expectation as found** and **24 met it after the documented fixes**; a **16-cell RLS coverage matrix** holding 8 vulnerable / 4 untested / 4 not applicable as found, and 8 remediated / 4 untested / 4 not applicable after — the untested and not-applicable counts are identical in both, because applying a fix does not create a check that was never written.

Ordering is computed and the rule is published on the page: severity, then unmet checks as found, then the approved scenario order, which is also the dependency order. All four findings being High is why the second and third criteria carry the ranking.

Three owner decisions were taken before implementation, all at the S4 pre-implementation checkpoint on 2026-09-07:

| Decision | Chosen | Recorded as |
|---|---|---|
| Report composition | Two columns per written MDS, not the three-column MDS-REF-007 arrangement | `MTS-OBS-028` |
| Findings list | Static and fully expanded; no severity filter, no collapse | `MTS-OBS-029` |
| The S1 deferral | Populate both landing regions now from real derived data | `MTS-DEV-001`, resolved |

**S4 opened one MDS gap, now closed.** `MDS-GAP-S4-001`: the MDS required the report to be printable without dark-page backgrounds but defined no print appearance. It was implemented without inventing a value — the print block redefines the approved tokens for the print medium, so no print-only colour exists — and three browser checks verify it in the print medium itself. The owner confirmed that treatment on 2026-09-07, so it is now an approved MDS decision, recorded as `MDS-CHG-003` and resolved in both state files. The rule it establishes: any future printable surface flips the approved tokens for print, never authors a print-only colour, and drops only controls that cannot function on paper — never evidence, state, limitation, recovery, or the CTA.

## S5 inquiry model

The inquiry store is **not reachable as a table**. Both `public.inquiries` and `public.inquiry_delivery_events` have RLS enabled with no policy AND every privilege revoked from `anon` and `authenticated` — two independent denials — and the entire reachable surface is two `SECURITY DEFINER` functions with a fixed empty `search_path`. `submit_inquiry` rate-limits, then deduplicates, then persists, in that order, and returns an outcome and a reference and nothing else; it never returns inquiry content, not even the content just submitted. `record_inquiry_delivery` is a one-shot bounded transition. Because nothing reads a table, **no service-role key is needed or read anywhere in the repository**.

Three rules are enforced in the data rather than only in the wording:

- **A duplicate creates no second row.** It advances the original's retention clock, increments a submission count, and hands back the *original* acknowledgement — which is what `MPS-RULE-006` means by not implying a second engagement. It also sends no second operator notification (`MTS-OBS-038`).
- **A redacted row cannot hold content.** Retention nulls every content column and a table `CHECK` constraint keeps them null for the row's lifetime, so `MPS-ACC-016` cannot be defeated by a later code path that forgets a column. What remains is the bounded opaque digest the rule permits.
- **An acknowledgement follows persistence.** `MPS-REQ-011` allows one only after a successful submission, so `acknowledged` is returned from exactly one branch. An unreachable or unconfigured store ends as *unconfirmed*, never as *received*.

A failed notification does **not** revoke the acknowledgement. Once the row exists the inquiry has been received; the buyer is told the record is safe and the alert did not go out, rather than being told to resubmit something already on record.

The schema lives in `supabase/inquiry/migrations`, a separate set applied to a separate database, and is deliberately outside the evidence recorder's input digest — so an inquiry migration cannot invalidate published evidence, and a fixture reset cannot see an inquiry. Both operator commands refuse to run against the fixture database by name.

## Hosted provisioning, and the defect it exposed

The isolated inquiry project was provisioned on 2026-09-08 and both migrations applied. Doing so found a **high-severity privilege defect that existed only in the hosted environment** (`MTS-OBS-044`): `anon` could execute the retention and manual-deletion functions, so any visitor holding the publishable key could have wiped inquiry content.

The cause is worth remembering. A hosted Supabase project ships `alter default privileges in schema public grant all on functions to anon, authenticated, service_role`, so every function the migration created was born with a **direct** grant to the application roles. `revoke ... from public` removes only the privilege held through PUBLIC; it does not touch a direct grant. The local container carries no such default, so one migration produced a correct privilege set locally and an unsafe one hosted.

The deny assertions were already right, and had passed 12/12 locally on every run since implementation. They had simply never run where the defaults differ. So the fix came with a control: `supabase/inquiry/tests/authorization-checks.sql` is now free of psql meta-commands and runs in both places — `pnpm inquiries:check` locally, and `pnpm inquiries:check:hosted` against the real project through the Management API, needing no database password. That runner was negative-tested: the bad grant was deliberately restored, the checker named the exact privilege and failed, and it passed again once revoked.

**A privilege assertion proves nothing about an environment it has not run in.** Any future schema applied to a hosted project must have its deny paths re-run there.

## Next action

**Reconciled 2026-09-14.** S6 is merged and deployed; R1 is not yet formally released or closed. The earlier "Next action" text (S5 closeout, the measurement-provider decision, and the red CI gate) is superseded: all of it happened and is recorded in `mts/MTS-PROJECT-STATE.yaml`.

Three rules from S5 remain binding on everything that follows:

1. **A deny assertion proves nothing about an environment it has not run in.** Any schema applied to a hosted project has its deny paths re-run there (`MTS-OBS-044`).
2. **An operator guard distinguishes environments by host, never by database name** (`MTS-OBS-045`).
3. **No credential-shaped literal enters this repository, not even a published example.** Assemble it at runtime, and never resolve a push-protection block by allowlisting (`MTS-OBS-046`).

**In progress — R1 closeout (`chore/r1-closeout`).** The owner ruled on the MDS Gate 2 findings on 2026-09-14: F001 and F002 are fixed in code, F005 is approved as `MDS-EXC-001`, F006's mobile order is written into DESIGN-SYSTEM §12 and AGENTS.md, and F007 is accepted for R1 with evidence navigation as an R2 investigation candidate. The stale status records are reconciled and the Gate 2 renders recaptured from the resulting tree.

**Owner decisions still open:**

- MDS Gate 2 visual sign-off, withheld until the recaptured comparison is reviewed.
- Formal S6 release approval, and whether to record MPS product validation, MDS compliance, and MTS Gate 7 and verification as closed.

**Owner operations still open (none may be recorded as passed until performed and observed):**

| Item | Blocking effect |
|---|---|
| Production rollback drill (proposed plan in `mts/RELEASE-AND-ROLLBACK.md` §3, count-only non-decreasing data condition) | Full MTS closeout; recommended before any promotion push |
| Confirm Vercel variable scopes — Supabase and Resend values in Production only (`MTS-EXC-003`) | MTS closeout. The code guard does not depend on it: Preview writes and sends nothing regardless |
| Edge request rate limiting (`MTS-OBS-037`) | MTS closeout; recommended before promotion |
| Confirm whether the production sender is a verified domain | MTS closeout (`resend_verified_domain_and_preview_safe_destination`) |
| Observe a production measurement event in the hosted measurement table | MTS closeout (`MTS-CAP-008`) |

**Resolved 2026-09-14 (`chore/r1-owner-operations`):** the shared preview/production store (`MTS-DEV-003`, `MTS-OBS-051`) through approved exception `MTS-EXC-003` — Preview is non-writing, hosted Preview inquiry and measurement delivery are intentionally untested, and a separate Preview project is reconsidered only for the read-only scanner or sustained post-R1 development.

**Then:** the portfolio-polish slice under `MPS-DEC-008` through `MPS-DEC-013`, its QA, the promotion package after the rollback drill, and — separately and outside R1 — an MPS Gate 1 for any read-only scanner.
