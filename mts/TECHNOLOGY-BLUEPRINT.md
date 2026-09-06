# Supabase SaaS Launch-Readiness Lab — MTS Technology Blueprint

Status: Gate 7 implementation-readiness draft
MTS: v0.6-draft
Consumed authority: MPS v1.1; MDS v1.0
Project mode: greenfield

## Approved architecture

| Layer | Approved technology | Boundary |
|---|---|---|
| Application | Next.js App Router + TypeScript | Server Components for public content; client components only for interaction |
| Delivery | Vercel preview and production | Repository-driven builds with separate environment values |
| Data | Supabase Postgres | Inquiry persistence and bounded synthetic fixtures; never unrestricted public vulnerability |
| Authorization | PostgreSQL grants + Supabase RLS | Server/database enforcement; tests required for allow and deny paths |
| Email | Resend | Server-side operator notification only |
| Measurement | First-party event boundary; PostHog conditional | Bounded events; no inquiry text or secrets |
| Verification | Playwright Test plus selected accessibility/security checks | Browser, responsive, recovery, and release evidence |
| Custom logic | Deterministic synthetic evidence engine | Resettable and isolated from production inquiry data |

## Environment boundaries

- local: synthetic fixtures only; local or isolated Supabase project; no production secrets.
- preview: isolated preview data and notification destination; safe synthetic evidence only.
- production: approved public site and inquiry store; no vulnerable live endpoint; owner-controlled secret configuration.

## Data flows

1. Public browser to Next.js public routes and interactive scenario controls.
2. Scenario control to server-side bounded evidence executor to synthetic result to browser.
3. Inquiry form to server validation, rate limit, and deduplication to Supabase inquiry record to Resend notification.
4. Browser/application events to first-party measurement boundary to approved measurement destination.

## Reliability and recovery

- Deterministic fixtures are versioned with the repository.
- Scenario execution has running, failure, retry, recovery, unavailable, and not-applicable states.
- Inquiry submission has validation, duplicate, delivery-failure, retry, and acknowledgement states.
- Deployments use preview before production and retain a prior deployment for rollback.
- Database migrations are additive/reversible where possible; production migration and rollback are owner-gated.

## Explicit non-goals

No buyer authentication, uploads, live scanning, customer data, real payment processing, formal penetration testing, certification, compliance attestation, AI execution, client portal, or billing in R1.

## MDS feedback contract

MDS owns tokens, visual hierarchy, components, responsive behavior, evidence vocabulary, and accessibility presentation. MTS must provide the runtime states MDS requires: loading, failure, retry, duplicate, unavailable, recovery, privacy, and authorization-boundary states. Any new user-facing behavior is an MDS/MPS gap, not an implementation shortcut.

## Open implementation prerequisites

- Standalone Git repository and baseline branch.
- Vercel project and preview/production configuration.
- Supabase project separation and migration workflow.
- Verified Resend domain and preview-safe notification destination.
- Owner confirmation of paid-plan/account posture before production activation.
