# Mercurius Build Roadmap — Supabase SaaS Launch-Readiness Lab

Status: Gate 7 implementation-readiness draft
Consumed: MPS v1.1 → MDS v1.0 → MTS v0.6-draft
Classification: greenfield
Current phase: S2 evidence and RLS proof
Current slice: S2 — implemented, awaiting owner approval
Readiness: P0 and S1 verified and approved; S2 implemented on branch `slice/s2-evidence-rls` and awaiting the S2 approval checkpoint before S3 begins

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
| S2 | implemented, awaiting owner approval | `pnpm check` green from a deleted `.next`; `pnpm evidence:verify` green against a live database (4/4 steps); 6 SQL fixture-safety checks; 33 unit tests; 305 Playwright checks (244 chromium desktop/wide/tablet/mobile, 61 firefox-desktop) against a build confirmed to contain the change under test; WebKit remains CI-only under MTS-EXC-002 and has not yet run |
| S3–S6 | not started | — |

Open S1 items carried into the S2 checkpoint are MTS-DEV-001, MTS-DEV-002 (now partially resolved), and MTS-OBS-001 through MTS-OBS-004. **Both MDS gaps are closed**: `MDS-GAP-S1-001` by the approved `color.border.control` token and `MDS-GAP-S1-002` by applying the COMPONENTS-PROPOSAL evidence-state shapes, together recorded as `MDS-CHG-001`.

`MTS-OBS-006`, `MTS-OBS-007` and `MTS-OBS-008` are confirmed by the owner. `MTS-OBS-016` is resolved. The remaining S2 items for the checkpoint are `MTS-OBS-009` through `MTS-OBS-015` in `mts/MTS-PROJECT-STATE.yaml`, which are recorded findings rather than open decisions, plus `MTS-OBS-017`.

**MTS-OBS-005 is decided.** On 2026-09-06 the owner confirmed recorded-and-disclosed as the R1 evidence posture: the lab presents recorded evidence from an isolated local fixture rather than a live query, discloses that in every panel caption and limitation, and adds no live scanning. A buyer wanting a live audit is handled through the inquiry path as a paid engagement outside the public product. Live capability is deferred to R2/R3, where it would be an MPS scope change and an MTS re-gate. Recorded as `MTS-DEC-008`; the two approved additions are implemented under `MTS-CHG-005` (transcript freshness gate, buyer-visible reproducibility statement) and the new risk `MTS-RISK-006` is controlled.

S2 opened no MDS gap.

## Local database

S2 introduces `supabase/`. `pnpm db:start` runs the database container only, on ports moved out of the CLI default range so the lab cannot collide with another local Supabase project. `pnpm evidence:record` re-records the transcript; `pnpm evidence:verify` proves the committed transcript still reproduces. None of this is needed to run or build the application — the deployed lab holds no database connection.

`pnpm evidence:check` is the half of that verification which needs no database: it recomputes the fixture digest from `supabase/migrations` and `supabase/tests/documented-tests.sql` and fails if the committed transcript no longer matches, so an edited fixture cannot leave a stale transcript being replayed to buyers. It runs inside `pnpm check` and `pnpm test:unit`, and is the first step of `pnpm evidence:verify`. `pnpm check` is the ordinary check chain: `format:check`, `lint`, `typecheck`, `evidence:check`, `test:unit`, `build`.

## Next action

Review the S2 checkpoint report and decide on the remaining open items, MTS-OBS-006 through MTS-OBS-015. MTS-OBS-005 is decided (`MTS-DEC-008`). S3 does not begin until S2 is approved.

**CI is wired** (`MTS-OBS-016`, resolved ahead of S6 on owner instruction). `.github/workflows/verify.yml` runs on every push to `main`, every pull request, and on demand:

| Job | What it proves |
|---|---|
| `checks` | `pnpm check` — format, lint, types, transcript freshness, 33 unit tests, production build |
| `evidence` | Supabase CLI 2.111.0 builds the fixture from `supabase/migrations`, then `pnpm evidence:verify` re-records twice from a clean database and compares byte for byte |
| `browsers` | The full Playwright matrix with `PLAYWRIGHT_WEBKIT=1` and `--with-deps`, which is the only place WebKit evidence can be produced (`MTS-EXC-002`) |

It needs no secret: the lab holds no database connection, the fixture is synthetic, and the evidence job builds its database on the runner. Selecting the provider filled `MTS-CAP-011`, whose `approved_selection` was null — recorded as `MTS-DEC-009` and **awaiting owner confirmation**. The workflow has not yet executed on GitHub; every command in it was proved locally, which is not the same as a green run.
