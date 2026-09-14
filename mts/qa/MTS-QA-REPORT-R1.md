# Supabase SaaS Launch-Readiness Lab — MTS QA Record (R1)

Protocol: `mts/qa/MTS-QA.md`
Status: **PASS WITH OPEN OWNER ACTIONS**
MTS version: v0.6-draft (Gate 6 approved; Gate 7 implementation readiness in progress)
Date: 2026-09-10
Recorded by: Claude (agent execution)

> Each check is recorded as pass, fail, or **not_run**, with command, environment,
> and artefact. No security, compliance, certification, or launch-readiness claim
> is made from an unrun check, and the not_run rows below are the reason this
> record is not an unqualified pass.

## Environment

| Field | Value |
|---|---|
| Commit | `slice/s6-measurement-and-release` @ `55b9357` plus this slice's QA additions |
| Host | Ubuntu 26.04 LTS, Node v24.17.0, pnpm 12.3.4 |
| Framework | Next.js 16.3.4 (App Router, Turbopack) |
| Harness | Playwright 1.63.0 |
| Hosted project | Supabase `vorxftvgvycrgduenark` (inquiry + measurement) |
| Deployment | Vercel `supabase-saas-launch-readiness-lab` |

## Required automated checks

| Check | Command | Environment | Result | Artefact |
|---|---|---|---|---|
| Format | `pnpm format:check` | local | pass | part of `pnpm check` |
| Lint | `pnpm lint` | local | pass | part of `pnpm check` |
| Types | `pnpm typecheck` | local | pass | part of `pnpm check` |
| Build | `pnpm build` | local, production, from a deleted `.next` | pass | route table shows all ten routes prerendered; two API routes dynamic |
| Evidence freshness | `pnpm evidence:check` | local | pass | a stale transcript fails the gate (MTS-RISK-006) |
| Unit and integration | `pnpm test:unit` | local | pass — **151 passed, 1 skipped** | evidence executor, replay executor, report model, inquiry submission, inquiry boundary, measurement boundary, evidence freshness. The skip is `inquiry-live-delivery.spec.ts`, which sends a real message and runs only under `INQUIRY_LIVE_DELIVERY=1`; it is recorded as skipped, not as passing |
| Browser, responsive, route, recovery | `pnpm test:e2e --workers=1` | local, production build | pass — **904 passed, 0 failed, 1 skipped**, 18.5 min, exit 0 | five projects: chromium mobile/tablet/desktop/wide, firefox desktop. The skip is the live-delivery test |
| Supabase migration and RLS allow/deny | `pnpm inquiries:check:hosted` | hosted | pass — **carried, not re-run in this pass** | Last run green 2026-09-10 when migration `20260909000005` was applied (MTS-OBS-052, resolved): RLS on both tables, zero policies, zero table grants to application roles, `anon` holds execute on the two submission-path functions only. It could NOT be re-run here: the script needs a Supabase Management API token, which this environment does not hold. Nothing in this QA pass touched the schema, so the result still describes the current database — but it is a carried result, not a fresh one. |
| Measurement payload redaction | `tests/unit/measurement-boundary.spec.ts` | local | pass | no payload field can hold free text or an identifier; no credential, session, cookie, or address is read anywhere in measurement |
| Secret / log / dependency | `tests/unit/inquiry-boundary.spec.ts`, GitHub push protection | local + remote | pass | no service-role key read anywhere; one module constructs a database client; no credential-shaped literal on disk (MTS-OBS-046) |
| CI verification gate | GitHub Actions `verify` | ubuntu runner | pass — **for commit `18d58d2`, not for this tree** | Run 34475496471 on this branch, green in 10m11s, browsers job at `workers: 1` including WebKit (MTS-EXC-002). The QA additions in this pass have not yet been through CI, so WebKit has not seen them. |

## Required manual checks

| Check | Result | Evidence |
|---|---|---|
| Every canonical asset and token loads | pass | MDS QA Gate 1 — every approved colour, radius, and motion token resolves to its approved value; Geist Sans and Mono load and apply; no failed asset request on any route |
| Landing, scenario, guided lab, report, inquiry, and mobile compared to approved MDS references | pass, with findings for owner ruling | `mds/qa/MDS-QA-REPORT-R1.md` §4; 86 renders in `mds/qa/renders/` |
| Keyboard, focus, semantics, contrast, reduced-motion review | pass | MDS QA Gate 3 §Accessibility |
| Mobile, tablet, desktop, wide, zoom, long-content, text-expansion review | pass | MDS QA Gate 3 — six required widths plus six intermediates, 320px reflow, 200% and 400% zoom, WCAG 1.4.12 text spacing, long-content stress |
| Browser console, network, font, and asset review | pass | asserted empty on all ten public routes (S1) |
| Vulnerable evidence is bounded; no live reusable exploit path | pass | the lab replays a transcript recorded from an isolated local fixture; the published application holds no database connection and runs no new query against any system; no API route exposes the evidence engine (S2) |
| Inquiry success, duplicate, validation failure, delivery failure, retry, acknowledgement | pass — **after a defect found and fixed in this pass** | S5 browser suite drives each state against the exact response the server returns; server decision logic proved separately against the real database and against injected stores. Focus did not reliably reach the acknowledgement (MTS-OBS-053); fixed and verified |
| Production promotion and rollback without deleting inquiry data | **not_run** | owner action — needs Vercel access. Procedure written and reviewed: `mts/RELEASE-AND-ROLLBACK.md` §3 |
| Preview environment configuration | **not_run** | owner action — separate Vercel Preview scope values and a preview-safe `INQUIRY_NOTIFICATION_TO`: `mts/RELEASE-AND-ROLLBACK.md` §5 |

## Risk and observation movement in this pass

| ID | Before | After |
|---|---|---|
| MTS-RISK-003 (privacy) | open, high | **closed** 2026-09-10 against verified controls on storage, analytics, logs, delivery, and isolation, with two residuals stated: no record has yet aged past 12 months, and MTS-DEV-003 |
| MTS-OBS-053 (recorded as a flaky focus assertion) | open, low | **resolved** — it was not a flake. It recurred in this pass at one worker; the cause is a `focus()` call on a `display: none` live region from a `requestAnimationFrame` that beat React's commit. Fixed by moving the focus into a post-commit effect; verified 138/138 at `--repeat-each=6` on the project where it failed. Severity raised low → medium; the prior framing is withdrawn |
| MTS-DEV-003 (preview/production share one Supabase project) | open | unchanged — owner action; blocks calling the preview environment compliant with approved environment boundaries, not the production release |

## Result

**PASS WITH OPEN OWNER ACTIONS.**

Every automated check the protocol requires ran and passed. Every manual check
ran and passed except the two that need owner access to Vercel: the rollback
drill and the preview environment configuration. Those are recorded as not_run,
not as passing, and no promotion or recovery claim is made from them.

The remaining gate on the release is not technical: MDS Gate 2 needs the owner's
visual sign-off (`mds/qa/MDS-QA-REPORT-R1.md` §4).
