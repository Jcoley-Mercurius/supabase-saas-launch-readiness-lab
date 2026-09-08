# Mercurius Build Roadmap — Supabase SaaS Launch-Readiness Lab

Status: Gate 7 implementation-readiness draft
Consumed: MPS v1.1 → MDS v1.0 → MTS v0.6-draft
Classification: greenfield
Current phase: S5 inquiry path
Current slice: S5 — not started
Readiness: P0, S1, S2, S3 and S4 verified and approved; S4 merged to `main` as `ff89b28` on 2026-09-08 with no gap, exception, or deviation left open. S5 may begin.

## Approved route

P0 Bootstrap → S1 Public Shell → S2 Evidence/RLS → S3 Replay/Recovery → S4 Report → S5 Inquiry → S6 Combined QA/Release

## Owner prerequisites

Create the standalone Git repository, Vercel project, isolated Supabase environments, verified Resend domain, and private environment values. These actions are not silently performed by the coding agent.

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
| S5 | not started | Next. Needs the owner-gated notification destination before the delivery half can be verified — see below |
| S6 | not started | — |

Open S1 items carried into the S2 checkpoint are MTS-DEV-001, MTS-DEV-002 (now partially resolved), and MTS-OBS-001 through MTS-OBS-004. **Both MDS gaps are closed**: `MDS-GAP-S1-001` by the approved `color.border.control` token and `MDS-GAP-S1-002` by applying the COMPONENTS-PROPOSAL evidence-state shapes, together recorded as `MDS-CHG-001`.

**All S2 checkpoint items are closed.** `MTS-OBS-005` is decided (`MTS-DEC-008`); `MTS-OBS-006`, `-007` and `-008` are confirmed; `MTS-OBS-009` through `-015` are acknowledged by the owner on 2026-09-07; `MTS-OBS-016` is resolved by the CI gate; `MTS-OBS-017` and `-018` are recorded and resolved. `MTS-DEC-009` (GitHub Actions) is approved.

Two items stay live by design rather than closing with their observation:

- **`MTS-OBS-011`** — the fixture simplifies identity, not authorization, so it must never be exposed to a public network or reused as an application backend. This is the technical floor under the recorded-evidence posture and the first thing to revisit if R2/R3 reconsiders live capability.
- **`MTS-RISK-001` residual** — S5 adds a Supabase client for inquiries and must keep it on a path separate from the evidence engine.

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

## Next action

**Start S5, the inquiry path.** S4 merged to `main` as `ff89b28` (PR #6, all three CI jobs green including WebKit).

**S5 has one owner-gated dependency.** The route, form, validation, store, duplicate handling, retention, and MDS composition can all be built and verified without credentials. The notification half cannot: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `INQUIRY_NOTIFICATION_TO` are unset, no `.env.local` exists, and preview must use a preview-safe destination separate from production (`.env.example`, INTEGRATION-MANIFEST.md). Configuring that destination and approving the preview test is the owner action this slice's row calls for.

The owner approved `MTS-OBS-028` through `MTS-OBS-033` on 2026-09-07 (`MTS-CHG-010`) and confirmed
`MDS-GAP-S4-001` the same day (`MDS-CHG-003`, `MTS-CHG-011`), closing the last open S4 item. None of
the six observations required further work: four restate decisions already taken at the S4
pre-implementation checkpoint, and the other two record the derived/authored module split and two
responsive defects found and fixed during implementation.

**No gap, exception, or deviation is open anywhere in the MDS or MTS state.** PR #6 is green on all
three CI jobs including WebKit and awaits merge; update the `S4` row in `completed_slices` with the
merge commit when it lands. `/inquiry` still renders the S1 build-state notice — that is the
remaining half of `MTS-DEV-002` and is S5's work.

**CI is wired** (`MTS-OBS-016`, resolved ahead of S6 on owner instruction). `.github/workflows/verify.yml` runs on every push to `main`, every pull request, and on demand:

| Job | What it proves |
|---|---|
| `checks` | `pnpm check` — format, lint, types, transcript freshness, 33 unit tests, production build |
| `evidence` | Supabase CLI 2.111.0 builds the fixture from `supabase/migrations`, then `pnpm evidence:verify` re-records twice from a clean database and compares byte for byte |
| `browsers` | The full Playwright matrix with `PLAYWRIGHT_WEBKIT=1` and `--with-deps`, which is the only place WebKit evidence can be produced (`MTS-EXC-002`) |

It needs no secret: the lab holds no database connection, the fixture is synthetic, and the evidence job builds its database on the runner. Selecting the provider filled `MTS-CAP-011`, whose `approved_selection` was null — recorded as `MTS-DEC-009` and **approved by the owner on 2026-09-07**.

**First run: green.** Run `34129317849` on PR #3 passed all three jobs on the first attempt — 366 browser checks at one worker (364 passed, 2 flaky on retry, 0 failed), including **61 WebKit checks, the first WebKit evidence this project has had** (`MTS-EXC-002`). The evidence job reproduced the committed transcript from a clean database on a fresh runner, which proves determinism on hardware that had never seen the fixture.
