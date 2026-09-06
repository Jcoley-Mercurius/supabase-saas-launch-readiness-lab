# Supabase SaaS Launch-Readiness Lab — MTS Gate 5 Recommendation

Project ID: `supabase-saas-launch-readiness-lab`  
MTS version: `v0.4-draft`  
Gate: 5 — Recommendation  
Status: Proposed for Gate 6 approval  
Recommendation confidence: High for R1 fit; medium for final account cost until deployment/email accounts are confirmed  
Verified: 2026-09-06

## Decision to make

The Supabase SaaS Launch-Readiness Lab needs a low-traffic public web application that can present design-accurate evidence, run bounded synthetic scenarios, capture authorized-review inquiries, and produce auditable browser/security/recovery evidence without deploying a reusable vulnerability.

## Recommended architecture

### Application and runtime — BUILD

Use **Next.js App Router with TypeScript** as the custom application layer. Use server-rendered public content and server-side route handlers for inquiry mutations and bounded scenario execution. Use client components only where interaction requires browser state.

Why: it fits the approved MDS composition, supports the required loading/error/recovery states, works with Josh’s WSL/Ubuntu workflow, and keeps private operations on the server boundary.

### Hosting and delivery — BUY/CONFIGURE

Use **Vercel** for preview and production deployments, repository-driven builds, environment separation, and rollback to a prior deployment.

Why: it minimizes operational burden for a portfolio product and has first-party Next.js deployment alignment. The actual account plan and usage must be confirmed before production billing is treated as approved.

### Data and authorization — BUY/EXTEND

Use **Supabase Postgres** for inquiry persistence and only the synthetic data needed to make the evidence credible and repeatable. Enforce RLS and least-privilege grants in migrations, and test allow/deny behavior with database tests.

Do not create a public unrestricted vulnerable database. The vulnerable demonstration must use a bounded, resettable server-side fixture/test harness or equivalent isolated execution path. The product may show evidence of a documented vulnerability without exposing a reusable exploit endpoint.

### Inquiry delivery — BUY/CONFIGURE

Use **Resend** for server-side operator notifications after a verified sending domain is available. Store only the approved inquiry fields, keep the API key server-side, and make delivery failure/retry/unconfirmed states explicit in the MDS experience.

### Measurement — BUILD first; BUY only if approved

Implement the approved event taxonomy behind a small internal measurement boundary. Use **PostHog** only if the privacy review accepts the required data flow; otherwise retain a first-party event endpoint or defer measurement beyond essential operational events.

No inquiry free text, secrets, credentials, raw evidence payloads, or private operational details may enter analytics.

### Verification — BUILD/BUY

Use **Playwright Test** for end-to-end, responsive, cross-browser, interaction, recovery, screenshot, and report evidence. Add accessibility, dependency, and secret-scanning checks as separately selected packages/tools during implementation readiness.

## Candidate comparison

| Candidate | Decision | Fit | Main tradeoff |
|---|---|---|---|
| Next.js + Vercel + Supabase + Resend + bounded custom evidence engine | **Recommended** | Best overall fit for MPS/MDS, WSL workflow, portfolio credibility, and low operational burden | Requires disciplined separation between public evidence and private inquiry data |
| Next.js + Vercel + minimal server route, no persistent Supabase at first | Conditional alternative | Lowest data and service footprint | Weakens direct RLS/data-isolation proof and postpones part of the portfolio differentiator |
| Docker + self-hosted Postgres + independent services | Rejected for R1 | Portable and infrastructure-controlled | Adds operations, backups, patching, monitoring, and rollback burden without product benefit at launch |
| Live vulnerable Supabase endpoint | Rejected | Would appear technically direct | Unsafe, reusable by third parties, and incompatible with the approved MPS/MTS safety boundary |

## Security and privacy rules

- Public browser data, synthetic evidence, inquiry data, notification delivery, and operator operations remain separate trust boundaries.
- Supabase private/service credentials never enter client code, screenshots, logs, analytics, URLs, or evidence artifacts.
- RLS tests cover grants, policies, positive authorization, negative authorization, and the actual application roles.
- Inquiry records follow the approved 12-month retention rule and earlier manual deletion path.
- Duplicate submissions are deduplicated without implying duplicate engagements.
- Email acknowledgement never means engagement acceptance, price, timeline, or launch guarantee.
- Reset/reseed commands cannot target production inquiry data.
- The lab never performs live scanning or testing of third-party systems.

## Cost and operations

The recommendation is compatible with the approved $50/month launch ceiling if the existing Vercel account is used, traffic remains low, and Supabase is kept on the lowest plan that meets the required evidence/reliability posture. Supabase Free is suitable for early testing but may pause inactive projects; Supabase Pro is listed at $25/month and includes compute credits. PostHog advertises a free 1M-event monthly tier. Vercel and Resend usage/account costs remain owner-confirmation items.

Operational posture:

- Preview and production use separate environment variables and data stores.
- Deployment is repository-driven and reversible.
- Synthetic evidence is deterministic, resettable, and testable.
- Inquiry delivery is observable without logging sensitive content.
- Optional uptime alerting is deferred until after R1 launch evidence exists.

## Agent-skill recommendation

| Capability | Criticality | Selection | Target environment | Invocation and fallback |
|---|---|---|---|---|
| Mercurius Technology System | required | selected methodology | Codex planning | Govern MTS state; canonical artifacts remain authoritative |
| Next.js guidance | required for framework slices | proposed | Codex; Claude uses project-local instructions if equivalent skill is unavailable | Invoke for framework/routing/cache work; fallback is official Next.js docs plus `AGENTS.md` |
| Vercel deployment guidance | recommended | proposed | Codex; Claude fallback via project-local deployment instructions | Invoke for preview/production/rollback work; no connector required for core implementation |
| Supabase implementation guidance | recommended | project-local official-doc contract | Codex and Claude | Use official Supabase docs, migrations, and tests; do not assume cross-agent skill parity |
| Browser verification | required for QA slices | proposed | Codex/implementation environment where available | Use Playwright commands and committed test config; fallback is documented browser/manual evidence |
| Security plugin or connector | optional | not selected | Neither | Do not install or connect for R1 unless a later evidence gap justifies it |
| Analytics connector/plugin | rejected for core build | not selected | Neither | Use the application measurement boundary; do not grant broad external access |

No persistent plugin, connector, or external account connection is approved by this recommendation.

## Approval package for Gate 6

Approval should cover the following as one coherent technology decision:

1. Next.js App Router and TypeScript.
2. Vercel preview/production delivery.
3. Supabase Postgres for isolated inquiry persistence and tested RLS/data boundaries.
4. Resend for server-side inquiry notifications, subject to domain/account setup.
5. First-party measurement boundary, with PostHog conditional rather than automatic.
6. Playwright as the required browser-verification foundation.
7. The bounded synthetic evidence rule and rejection of a public vulnerable endpoint.
8. The proposed required/recommended/optional agent-skill posture above.

Approval does not authorize production credentials, live scanning, customer data, billing, or any out-of-scope MPS capability.

## Evidence and sources

The recommendation is based on the Gate 4 research and current first-party documentation:

- Next.js App Router and installation: https://nextjs.org/docs/app and https://nextjs.org/docs/app/getting-started/installation
- Next.js deployment and verified adapters: https://nextjs.org/docs/pages/getting-started/deploying and https://nextjs.org/docs/app/guides/deploying-to-platforms
- Vercel pricing: https://vercel.com/pricing
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase pricing: https://supabase.com/pricing
- Resend: https://resend.com/docs/introduction
- PostHog pricing: https://posthog.com/pricing
- Playwright: https://playwright.dev/docs/intro
