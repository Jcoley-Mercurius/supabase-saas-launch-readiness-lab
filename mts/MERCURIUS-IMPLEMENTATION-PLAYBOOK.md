# Mercurius Implementation Playbook — Supabase SaaS Launch-Readiness Lab

Status: Gate 7 implementation-readiness draft
Run exactly one stage prompt at a time. Stop at every checkpoint.
Read root AGENTS.md, the current MPS/MDS/MTS state, and the current Agent Skill Manifest before editing.

## Canonical handoff placement

Preserve mps/, mds/, mts/, root AGENTS.md, and every referenced canonical image with their relative paths. Do not flatten, rename, substitute, or copy exploratory assets over canonical assets. Verify the MDS reference inventory before UI work.

## Command lane

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

Dashboard actions: create the Git repository, Vercel project, isolated Supabase projects/environments, and verified Resend domain. Configure variable names privately; never place values in this playbook, source, prompts, or commits.

## P0 — handoff and repository verification

~~~text
Read root AGENTS.md, mps/MPS-PROJECT-STATE.yaml, mds/MDS-PROJECT-STATE.yaml, mts/MTS-PROJECT-STATE.yaml, the MPS/MDS handoffs, mts/TECHNOLOGY-BLUEPRINT.md, mts/INTEGRATION-MANIFEST.md, mts/SECURITY-ARCHITECTURE.md, mts/AGENT-SKILL-MANIFEST.yaml, and mts/IMPLEMENTATION-PLAN.md. Inspect the repository, package manager, lockfile, scripts, and environment-variable names before editing. Verify the canonical package and MDS reference assets are present and project-scoped to the Supabase SaaS Launch-Readiness Lab. Verify required skills MTS methodology, framework guidance, and browser verification; use manifest fallbacks when an equivalent coding-agent skill is unavailable. Do not implement product features. Report missing files, commands, skills, permissions, and external setup. Stop at the P0 checkpoint.
~~~

## S1 — public MDS shell

~~~text
Implement only S1, the public MDS shell and scenario navigation. Read the MPS public-positioning requirements, MDS specification/tokens/components/composition/QA, and the MTS blueprint/plan. Verify Next.js guidance or use the official-doc fallback. Build only the approved public narrative, navigation, scenario entry, responsive shell, and shared loading/error/unavailable states. Do not build evidence execution, inquiry persistence, live scanning, auth, billing, or new product behavior. Run lint, typecheck, build, keyboard/focus, responsive viewport, console, and asset checks. Update only S1 status and stop.
~~~

## S2 — bounded evidence and RLS proof

~~~text
Implement only S2. Read MPS evidence requirements/acceptance, MDS evidence components/states, MTS capability matrix, blueprint, security architecture, and integration manifest. Verify MTS methodology and security guidance; use official Supabase docs and fallback if needed. Build deterministic synthetic fixtures, a bounded server-side evidence executor, the RLS coverage model, and resettable allow/deny tests. Never expose a reusable public vulnerable endpoint or accept third-party targets. Include running, vulnerable, remediated, untested, unavailable, and limitation states. Run fixture determinism, authorization, reset safety, secret/log, accessibility, and browser checks. Update only S2 status and stop.
~~~

## S3 — replay and recovery

~~~text
Implement only S3. Read the MPS webhook/reliability requirements, MDS replay/failure/recovery states, MTS security architecture, and integration manifest. Verify security guidance before editing. Build synthetic event replay with deterministic logical IDs, an idempotency ledger or equivalent bounded store, controlled failure injection, retry, unavailable, and recovery states. Do not add real payments or external payment webhooks. Test first event, duplicate event, failure, retry, recovery, ordering, and no-sensitive-log behavior. Run browser and accessibility checks. Update only S3 status and stop.
~~~

## S4 — report and case study

~~~text
Implement only S4. Read MPS report/case-study requirements, MDS report reference and printable hierarchy, tokens, components, and QA rules. Verify framework guidance or official-doc fallback. Compose the severity-ranked report, case-study narrative, evidence links, limitations, print behavior, and authorized-engagement CTA from the implemented evidence model. Do not invent security claims, certification, confidence, pricing, or unsupported findings. Run traceability, print, responsive, accessibility, visual-reference, and route checks. Update only S4 status and stop.
~~~

## S5 — inquiry path

~~~text
Implement only S5. Read MPS inquiry requirements/rules/acceptance, MDS inquiry states, MTS integration manifest, security architecture, and retention policy. Verify framework and security guidance. Build server-side validation, rate/abuse control, deduplication, Supabase persistence, Resend notification boundary, retention metadata, and success/failure/retry/duplicate/unconfirmed states. Keep keys server-side and exclude inquiry content from analytics/logs. Do not add accounts, billing, scheduling, contracts, or engagement acceptance. Run schema, privacy, duplicate, delivery-failure, retry, authorization, accessibility, and browser tests. Update only S5 status and stop.
~~~

## S6 — combined verification and release

~~~text
Implement only S6. Read all current MPS/MDS/MTS state, mts/qa/MTS-QA.md, MDS QA, the implementation plan, and the skill manifest. Verify browser and deployment guidance before use. Add only the approved measurement boundary, final verification configuration, preview build, and rollback evidence. Run lint, typecheck, unit/integration/e2e, database authorization, secret/dependency, accessibility, responsive/visual, console/network/font/asset, inquiry, replay, recovery, and MPS acceptance checks. Record pass/fail/not-run honestly. Do not promote production or change secrets without Josh's explicit release action. Update final slice status and stop.
~~~

## Final owner checkpoint

Josh reviews preview evidence, confirms environment values and notification destination, then separately authorizes production promotion. Rollback is the prior known-good deployment; migrations and inquiry data are preserved.
