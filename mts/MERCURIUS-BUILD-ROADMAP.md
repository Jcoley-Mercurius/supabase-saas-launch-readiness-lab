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
| S6 | measurement boundary, full QA, preview release, rollback record | approve production promotion | combined MPS/MDS/MTS evidence and owner release gate |

## Required skills

The current manifest is mts/AGENT-SKILL-MANIFEST.yaml. Required skills are MTS methodology, framework guidance, and browser verification. Official documentation plus project AGENTS.md are approved fallbacks when an equivalent coding-agent skill is unavailable; missing required skills without that fallback block the dependent slice.

## Slice status

| Slice | Status | Evidence |
|---|---|---|
| P0 | verified | Clean baseline, canonical package, environment contract, skill fallbacks recorded |
| S1 | approved | Merged to `main` as `f3d18d3` |
| S2 | implemented, awaiting owner approval | format, lint, typecheck, production build; 6 SQL fixture-safety checks; 32 executor and matrix unit tests; two clean-database re-recordings matching the committed transcript byte for byte; 90 Playwright checks across chromium desktop/wide/tablet/mobile and firefox-desktop against the production build; WebKit remains CI-only under MTS-EXC-002 |
| S3–S6 | not started | — |

Open S1 items carried into the S2 checkpoint are MTS-DEV-001, MTS-DEV-002 (now partially resolved), MTS-OBS-001 through MTS-OBS-004, and the MDS gaps MDS-GAP-S1-001 and MDS-GAP-S1-002.

Open S2 items for the checkpoint are MTS-OBS-005 through MTS-OBS-015 in `mts/MTS-PROJECT-STATE.yaml`. MTS-OBS-005 is the one that needs an explicit owner decision: the lab presents recorded evidence from an isolated local fixture rather than a live query, and discloses that in every panel caption and limitation.

S2 opened no MDS gap.

## Local database

S2 introduces `supabase/`. `pnpm db:start` runs the database container only, on ports moved out of the CLI default range so the lab cannot collide with another local Supabase project. `pnpm evidence:record` re-records the transcript; `pnpm evidence:verify` proves the committed transcript still reproduces. None of this is needed to run or build the application — the deployed lab holds no database connection.

## Next action

Review the S2 checkpoint report and decide on MTS-OBS-005 through MTS-OBS-015. S3 does not begin until S2 is approved.
