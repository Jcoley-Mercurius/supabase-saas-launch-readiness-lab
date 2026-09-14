# Supabase SaaS Launch-Readiness Lab — Release and Rollback Record

Status: R1 release record — S6 merged and deployed (`fcb30f5`, 2026-09-14); formal release approval and the rollback drill outstanding\
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
| preview | any branch / pull request | Vercel, automatically on push | isolated inquiry project (**shared with production — see §5**) |
| production | `main` | Vercel, automatically on merge | isolated inquiry project |

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
5. Environment variables are set per Vercel scope. Preview and production hold
   **separate** values, and preview points at a preview-safe notification
   destination (§5).
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
| Production measurement event reaches the hosted table | **not observed** | needs a read-only query with owner access |
| Edge request rate limiting (MTS-OBS-037) | **not configured / not recorded** | owner action in Vercel; the in-database counters still bound what reaches the store |
| MDS QA protocol executed and recorded | run | 2026-09-10; `mds/qa/MDS-QA-REPORT-R1.md` — Gate 1 PASS, Gate 3 PASS. Every Gate 2 finding ruled on by the owner 2026-09-14; F001 and F002 fixed and renders recaptured on `chore/r1-closeout` |
| MPS QA protocol executed and recorded | run, green | 2026-09-10; `mps/qa/MPS-QA-REPORT-R1.md` — all sixteen acceptance criteria |
| MTS QA protocol executed and recorded | run | 2026-09-10; `mts/qa/MTS-QA-REPORT-R1.md` — pass with owner actions outstanding |
| Preview deployment reviewed against MDS references | **not run** | a preview deployment exists for every pull request (for example `383c780`); an owner review has not been recorded |
| MDS Gate 2 owner sign-off | run, approved | 2026-09-14, Josh Coley, on the comparison recaptured in PR #14 (merged `739b2a7`); MDS compliance PASS WITH APPROVED EXCEPTIONS (`mds/qa/MDS-QA-REPORT-R1.md` §13). Not release approval |
| Formal S6 release approval | **not run** | owner checkpoint |
| Preview environment variables set separately from production | **not run** | owner action in the Vercel dashboard |
| Preview-safe notification destination confirmed | **not run** | owner action; the application-side labelling is in place (§5) |
| Separate Supabase project for preview (MTS-DEV-003) | **not run** | owner action; the rest is scripted (§5) |
| Promote a prior deployment (rollback drill) | **not run** | owner action; needs Vercel access |
| Post-rollback inquiry data intact | **not run** | follows the drill |

---

## 5. Preview safety

Two halves, and only one of them is the application's.

**The application's half, in place.** `lib/inquiry/notify.ts` labels every
notification that did not come from production, in the subject and in the first
line, using `VERCEL_ENV` as the server actually sees it. An operator can tell at
a glance that a message came from preview, so a test submission is never
answered as though a buyer sent it. `lib/deployment.ts` treats any unknown
environment as local, so nothing is ever mislabelled as production.

**The owner's half, outstanding.** The destination itself is configuration:
`RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `INQUIRY_NOTIFICATION_TO` must be set
in the Vercel **Preview** scope separately from **Production**, with
`INQUIRY_NOTIFICATION_TO` pointing at an address that is safe to fill with test
submissions.

**What neither half fixes (MTS-DEV-003).** There is one hosted Supabase project,
so a preview submission writes a real row to the same inquiry store as a
production submission, under the same retention policy and the same deduplication
key — a test submission can occupy a genuine buyer's dedupe key and get their
real inquiry treated as a duplicate. Labelling makes it visible; it does not make
it separate.

This is a **deviation from approved architecture, not an open question**.
TECHNOLOGY-BLUEPRINT.md "Environment boundaries" already requires preview to hold
isolated preview data and an isolated notification destination, and
INTEGRATION-MANIFEST.md lists creating isolated Supabase *environments* as an
owner dashboard action. The remedy is therefore specified, not chosen:

1. Owner creates a second Supabase project for preview.
2. Apply both migration sets to it:
   `pnpm inquiries:migrate:hosted supabase/inquiry/migrations/<file> <new-ref>`
   for each file in order.
3. Point the Vercel **Preview** scope at it —
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — alongside
   a preview-safe `INQUIRY_NOTIFICATION_TO`.
4. `pnpm inquiries:check:hosted <new-ref>` to prove the deny paths and the full
   taxonomy on the new project.

Only step 1 needs the dashboard. Production is correct and unaffected either way.
