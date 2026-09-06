# Supabase SaaS Launch-Readiness Lab — MTS Implementation Plan

Status: Gate 7 implementation-readiness draft
Project mode: greenfield
Consumed: MPS v1.1, MDS v1.0, MTS v0.6-draft

## Bootstrap command lane (WSL/Ubuntu)

Run from the user-selected parent directory. Do not run against a production directory.

~~~bash
node --version
pnpm --version
git --version
mkdir -p "$HOME/projects"
cd "$HOME/projects"
pnpm create next-app@latest supabase-saas-launch-readiness-lab --yes
cd supabase-saas-launch-readiness-lab
git init
git checkout -b main
pnpm add @supabase/ssr @supabase/supabase-js zod resend
pnpm add -D @playwright/test prettier prettier-plugin-tailwindcss
pnpm exec playwright install
pnpm run lint
pnpm run build
~~~

The current Next.js installation guide requires Node.js 20.9+ and supports WSL. The agent must inspect generated package scripts and the lockfile before changing them. If pnpm or generated defaults differ, stop and reconcile against current official docs.

## Planned repository layout

~~~text
src/app/
src/components/
src/lib/evidence/
src/lib/inquiries/
src/lib/supabase/
src/lib/email/
src/lib/measurement/
supabase/migrations/
supabase/tests/
tests/
public/
mds/
mps/
mts/
~~~

## Ordered phases and slices

| ID | Outcome | Dependencies | Verification |
|---|---|---|---|
| P0 | Repository, handoff, skills, and environment contract verified | None | clean baseline, package scripts, artifact inventory |
| S1 | MDS-compliant public shell and scenario navigation | P0 | lint/type/build, visual/responsive/keyboard smoke |
| S2 | Deterministic bounded evidence engine and RLS proof | S1 | fixtures, allow/deny tests, reset, status transitions |
| S3 | Webhook replay/idempotency and failure/recovery proof | S2 | duplicate, retry, unavailable, recovery tests |
| S4 | Severity-ranked report and case-study publication | S2, S3 | traceability, print layout, limitations, CTA |
| S5 | Inquiry capture, retention, dedupe, and notification | S1; may use S2 data contracts | validation, duplicate, privacy, delivery failure/retry |
| S6 | Measurement, combined QA, preview, release, rollback | S1-S5 | full MPS/MDS/MTS verification and owner release gate |

## Definition of done

Each slice must have actual tests, accessibility evidence, responsive evidence, security/privacy checks, MPS/MDS traceability, no unapproved scope, and a checkpoint report. A required skill may be replaced only by its documented fallback.

## Rollback

Use branch and commit checkpoints per slice. Revert application changes to the previous slice commit; roll back preview deployment to the prior known-good version; use additive/reversible migrations; never reset or delete production inquiry data as part of a code rollback.
