# Supabase SaaS Launch-Readiness Lab — Release and Rollback Record

Status: R1 release record — S6 merged and deployed (`fcb30f5`, 2026-09-14); Preview non-writing under MTS-EXC-003; formal release approval and the rollback drill outstanding\
Authority: MTS v0.6-draft — TECHNOLOGY-BLUEPRINT.md ("deployments use preview before
production and retain a prior deployment for rollback"; "migrations are
additive/reversible where possible; production migration and rollback are
owner-gated"), IMPLEMENTATION-PLAN.md "Rollback", qa/MTS-QA.md ("verify production
promotion and rollback procedure without deleting inquiry data").

This file records the procedure and, separately, **what has actually been exercised**.
A procedure that has been written but not run is recorded as not run. No release,
promotion, or recovery claim is made from an unexercised step.

---

## 1. What is deployed, and from where

| Environment | Source | Deployed by | Data |
|---|---|---|---|
| local | working tree | `pnpm dev`, `pnpm build && pnpm start` | synthetic fixtures only; no application database connection |
| preview | any branch / pull request | Vercel, automatically on push | **none** — non-writing by code (MTS-EXC-003, §5) |
| production | `main` | Vercel, automatically on merge | isolated inquiry project — the only environment that persists |

Vercel project: `supabase-saas-launch-readiness-lab`, connected 2026-09-09
(MTS-CHG-018). Production URL:
<https://supabase-saas-launch-readiness-lab.vercel.app/>.

**Production tracks `main`.** Anything on a slice branch is live only in preview
until the branch is merged. This is the ordinary consequence of the approved
model and is stated here because it is easy to read a green branch as a hardened
site. (The S6 response security headers, MTS-OBS-048, were branch-only when this
was first written; they merged and are verified live.)

As of 2026-09-14 production serves merge commit `fcb30f5` (PR #13). The prior
production deployment, `f7e1f8b`, is the rollback target a drill would promote.

---

## 2. Release procedure

1. `pnpm check` green from a deleted `.next` (format, lint, types, transcript
   freshness, unit tests, production build).
2. Browser suite green across the approved projects. WebKit is CI-only
   (MTS-EXC-002).
3. `pnpm inquiries:check:hosted` green against the hosted project — the inquiry
   and measurement deny paths, proved where they actually matter (MTS-OBS-044).
4. **Migrations before code.** Any migration the new build depends on is applied
   to the hosted project first with `pnpm inquiries:migrate:hosted <file> <ref>`,
   and the deny assertions are re-run afterwards. A build that reaches a
   constraint the database does not yet have does not fail loudly: measurement
   drops the event silently by design, so the symptom is a metric reading zero
   rather than an error. `pnpm inquiries:check:hosted` now asserts that every
   declared event name is accepted by the target database, so a missed
   migration fails the gate instead — but the order still matters, because the
   gate is what catches it and the gate runs before the deploy.
5. Environment variables are set per Vercel scope. Supabase and Resend values
   are in the **Production** scope only; Preview holds none, and would write
   nothing even if it did (MTS-EXC-003, §5).
6. Open a pull request. CI runs the same gate. Review the preview deployment
   against the approved MDS references at the four breakpoints.
7. Merge to `main`. Vercel promotes automatically.
8. Post-merge: confirm the verify workflow is green on `main`, and confirm the
   production URL serves the expected build.

---

## 3. Rollback procedure

Rollback is by **deployment**, not by database.

**Code.** Promote the prior known-good deployment in Vercel (Deployments → the
last green production deployment → Promote to Production). This is instant and
needs no build. If the defect is already merged, follow it with a `git revert`
on `main` so the repository and the live site agree — a promoted rollback that
is not reverted will be undone by the next merge.

**Database.** Do not roll a migration back to recover a code deploy. Every
migration in this repository is additive:

- the inquiry schema adds tables and functions;
- `20260909000003` and `20260909000004` add the `measurement` schema and bound
  its write path;
- `20260909000005` **widens** a check constraint to admit `landing_viewed`.

Widening is forward-compatible in the direction rollback runs: an older build
never sends `landing_viewed`, so the constraint being wider than that build
expects costs nothing. Reversing it, by contrast, would start rejecting events
the newer build is still sending, and the rejection is silent.

**Inquiry data is never part of a rollback.** No rollback step deletes,
truncates, or resets an inquiry row. Retention is a separate, scheduled,
owner-approved process (MTS-DEC-013, MTS-DEC-015) and is the only thing that
removes inquiry content.

**If a migration itself is the defect**, write a new forward migration that
corrects it and apply it through the same path. That keeps the migration set an
append-only history of what the database actually did.

### Proposed rollback drill — not executed

A proposed plan, recorded so it can be reviewed before it is run. Nothing below
has been performed. It needs Vercel access and is an owner action.

1. Record the current production deployment (`fcb30f5` or its successor) and
   choose the prior known-good production deployment as the target.
2. **Immediately before rollback**, record count-only values from the hosted
   project: `select count(*) from public.inquiries` and
   `select count(*) from public.inquiry_delivery_events`. Counts only — no
   column of either table is selected or displayed.
3. Promote the prior deployment in Vercel. No schema or database operation of
   any kind is performed during the drill.
4. Confirm by request that production serves the prior build: public routes
   answer 200, both API routes answer 405 to GET, and the security headers are
   present. **The drill does not submit an inquiry.**
5. Roll forward by promoting the recorded current deployment again, and confirm
   by request that it is served.
6. **Immediately after roll-forward**, record the same two counts.

Data-integrity pass condition:

- Neither count is lower after roll-forward than before rollback.
- An increase is **not** a failure when it is consistent with legitimate
  production activity — production stays live throughout, so a real inquiry may
  arrive during the drill. Exact equality is not required.
- Both tables remain readable before and after.
- No schema or database operation was performed during the deployment rollback.
- No inquiry content was inspected or exposed at any point.
- Measurement counts are expected to change with visits and are **not** used for
  any equality check.

---

## 4. Evidence — what has been exercised

| Step | Status | Evidence |
|---|---|---|
| `pnpm check` green from a deleted `.next` (earlier run) | run, green | 2026-09-09; 151 unit tests, exit 0 |
| Browser suite, five local projects (earlier run) | run | 2026-09-09/10; 677 passed, 22 failed, 1 skipped, 1.4h at two workers — superseded by the QA-pass run below |
| Those 22 re-run serially | run | 21 passed at one worker — runner contention. The twenty-second was MTS-OBS-053, later found to be a real focus defect and fixed in the QA pass |
| Browser suite, five local projects (combined QA pass) | run, green | 2026-09-10, at one worker on `55b9357` plus the uncommitted QA additions: 904 passed, 0 failed, 1 skipped. Local evidence for the QA tree, not for final `main` |
| `pnpm check` (combined QA pass) | run, green | 2026-09-10, from a deleted `.next`: 151 unit tests passed, 1 skipped (the live-delivery harness) |
| Browser suite incl. WebKit — pull request #13 head `383c780` | run, green | CI run 34842941040, 2026-09-14: 1,083 passed, 1 flaky (a WebKit `page.goto` internal error before any assertion, passed on retry), 2 skipped |
| Browser suite incl. WebKit — merge commit `fcb30f5` on `main` | run, green | CI run 34852162894, 2026-09-14: checks (151 unit passed, 1 skipped), evidence (clean-database reproduction), browsers (1,084 passed, 2 skipped, 0 failed, 0 flaky) — the final merged-tree evidence |
| Production serves the merged build | run, green | 2026-09-14, by request: all ten public routes 200, both API routes 405 to GET, all six security headers present, and the `fcb30f5` pillar-hue classes present in the served HTML |
| Hosted deny paths (`inquiries:check:hosted`) | run, green | 2026-09-09, and again 2026-09-10 after the landing migration, against project `vorxftvgvycrgduenark`. No inquiry migration has changed since; not re-run |
| Production response security headers | run, green | 2026-09-09; all six read back live, closing MTS-OBS-048; re-read 2026-09-14 |
| Migration `20260909000005` applied to the hosted project | run, green | 2026-09-10, `pnpm inquiries:migrate:hosted`; deny paths re-proved after |
| Production inquiry path end to end (MTS-OBS-049) | run, green | 2026-09-09 on owner instruction: one marked verification inquiry acknowledged with delivery accepted by Resend. It was then redacted through the approved path, `public.redact_inquiry`; only bounded deduplication and operational metadata remain, and the original inquiry content is not stored. This activity must be excluded from MPS-MET-003 and every conversion figure |
| Production sending domain | **not confirmed** | production delivery was accepted, but whether `RESEND_FROM_EMAIL` is a verified domain or the sandbox sender is not observable from the repository; owner to confirm |
| Hosted Preview inquiry and measurement delivery | **intentionally untested and unavailable** | MTS-EXC-003: Preview is non-writing in code; a Preview inquiry shows the unconfirmed state and sends nothing |
| Preview guard and browser-suite isolation | run, green locally | 2026-09-14, `chore/r1-owner-operations`: `tests/unit/deployment-boundary.spec.ts` (network stubbed), inquiry unit and browser suites; CI on the pull request |
| Production measurement event reaches the hosted table | **not observed** | needs a read-only query with owner access |
| Edge request rate limiting (MTS-OBS-037) | **not configured / not recorded** | owner action in Vercel; the in-database counters still bound what reaches the store |
| MDS QA protocol executed and recorded | run | 2026-09-10; `mds/qa/MDS-QA-REPORT-R1.md` — Gate 1 PASS, Gate 3 PASS. Every Gate 2 finding ruled on by the owner 2026-09-14; F001 and F002 fixed and renders recaptured on `chore/r1-closeout` |
| MPS QA protocol executed and recorded | run, green | 2026-09-10; `mps/qa/MPS-QA-REPORT-R1.md` — all sixteen acceptance criteria |
| MTS QA protocol executed and recorded | run | 2026-09-10; `mts/qa/MTS-QA-REPORT-R1.md` — pass with owner actions outstanding |
| Preview deployment reviewed against MDS references | **not run** | a preview deployment exists for every pull request (for example `383c780`); an owner review has not been recorded |
| MDS Gate 2 owner sign-off | run, approved | 2026-09-14, Josh Coley, on the comparison recaptured in PR #14 (merged `739b2a7`); MDS compliance PASS WITH APPROVED EXCEPTIONS (`mds/qa/MDS-QA-REPORT-R1.md` §13). Not release approval |
| Formal S6 release approval | **not run** | owner checkpoint |
| Vercel variable scopes confirmed (Supabase and Resend values in Production only) | **not run** | owner action in the Vercel dashboard; the code guard does not depend on it (§5) |
| Separate Supabase project for preview (MTS-DEV-003) | **not required** | resolved through MTS-EXC-003 on 2026-09-14; removed from the R1 blockers |
| Promote a prior deployment (rollback drill) | **not run** | proposed plan in §3; owner action; needs Vercel access |
| Post-rollback inquiry data intact | **not run** | follows the drill; count-only, non-decreasing condition in §3 |

---

## 5. Preview safety

**Preview is non-writing (MTS-EXC-003, approved 2026-09-14).** R1 persists inquiries
and measurement events in Production only. There is no separate Preview Supabase
project, and none is required for R1.

**Enforced in code, at one boundary.** `lib/supabase/server-client.ts` returns no
client, and reports Supabase as unconfigured, whenever `VERCEL_ENV` is `preview` —
even if Supabase values are present in the Preview scope by mistake. The
consequences follow from contracts that already existed:

- an inquiry ends **unconfirmed** (reason `unconfigured`): nothing is recorded, the
  buyer's answers stay in the form, and no operator notification is sent, because
  notification only follows a stored record;
- a measurement event is dropped without affecting what a visitor sees.

Production is unchanged. Local stays configuration-dependent, but the automated
browser suite and the capture harness serve a forcibly unconfigured server
(`HOSTED_SERVICES_UNSET` in `playwright.config.ts`), so a workstation `.env.local`
cannot reach the hosted project or Resend from a test run.

**Verified by** `tests/unit/deployment-boundary.spec.ts`, which stubs `fetch`, uses
`.example.invalid` hosts only, and fails if the guard is removed.

**Accepted consequence.** Hosted Preview inquiry and measurement delivery are
intentionally unavailable and untested. A Preview review covers visual and
behavioural fidelity over synthetic evidence; submitting the inquiry form on a
Preview deployment shows the approved unconfirmed state.

**Notification labelling stays.** `lib/inquiry/notify.ts` still labels every
non-production notification in its subject and first line. With Preview unable to
notify, that label can only appear on a local build pointed at a store, and it
claims nothing about which store that was.

**Owner configuration.** Keep `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and
`INQUIRY_NOTIFICATION_TO` in the Vercel **Production** scope only. The guard does
not depend on this; it removes a value that has no use.

**Reconsider when** the read-only scanner is taken up, or sustained post-R1
development needs hosted Preview persistence. Either reopens a separate Preview
Supabase project as an MTS decision.

MTS-DEV-003 and MTS-OBS-051, which recorded the earlier shared-store behaviour, are
resolved through this exception.
