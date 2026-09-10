# Supabase SaaS Launch-Readiness Lab — Release and Rollback Record

Status: S6 working record  
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

**Production tracks `main`.** Anything on a slice branch — including the response
security headers added in S6 (MTS-OBS-048) — is live only in preview until the
branch is merged. This is the ordinary consequence of the approved model and is
stated here because it is easy to read a green branch as a hardened site.

---

## 2. Release procedure

1. `pnpm check` green from a deleted `.next` (format, lint, types, transcript
   freshness, unit tests, production build).
2. Browser suite green across the approved projects. WebKit is CI-only
   (MTS-EXC-002).
3. `pnpm inquiries:check:hosted` green against the hosted project — the inquiry
   and measurement deny paths, proved where they actually matter (MTS-OBS-044).
4. **Migrations before code.** Any migration the new build depends on is applied
   to the hosted project first, and the deny assertions are re-run afterwards.
   A build that reaches a constraint the database does not yet have does not
   fail loudly: measurement drops the event silently by design, so the symptom
   is a metric reading zero rather than an error.
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
| `pnpm check` green from a deleted `.next` | run, green | 2026-09-09; 151 unit tests, exit 0 |
| Browser suite, five local projects | run | 2026-09-09/10; 677 passed, 22 failed, 1 skipped, 1.4h at two workers |
| Those 22 re-run serially | run | 21 passed at one worker — runner contention, not defects. The twenty-second is MTS-OBS-053, an intermittent focus assertion that passed 6/6 on this branch and 6/6 on `origin/main` when re-measured quietly |
| Browser suite incl. WebKit | not run here | CI only (MTS-EXC-002); runs on the pull request |
| Hosted deny paths (`inquiries:check:hosted`) | run, green | 2026-09-09, against project `vorxftvgvycrgduenark` |
| Production response security headers | run, green | 2026-09-09; all six read back live, closing MTS-OBS-048 |
| Migration `20260909000005` applied to the hosted project | **not run** | blocked in-session; MTS-OBS-052 |
| Preview deployment reviewed against MDS references | **not run** | needs a preview deployment of this branch |
| Preview environment variables set separately from production | **not run** | owner action in the Vercel dashboard |
| Preview-safe notification destination confirmed | **not run** | owner action; the application-side labelling is in place (§5) |
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

**What neither half fixes (MTS-OBS-051).** There is one hosted Supabase project,
so a preview submission writes a real row to the same inquiry store as a
production submission, under the same retention policy and the same deduplication
key. Labelling makes it visible; it does not make it separate. Options are a
second Supabase project for preview, or accepting the shared store and treating
preview submissions as live data. That is an owner decision and is not taken here.
