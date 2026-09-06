# Supabase SaaS Launch-Readiness Lab — MTS Gate 4 Research

Project ID: `supabase-saas-launch-readiness-lab`  
MTS version: `v0.3-draft`  
Gate: 4 — Research  
Status: Research complete; recommendation pending owner approval  
Verified: 2026-09-06

## Research boundary

This document evaluates current technology candidates against the approved R1 capabilities. It does not itself approve a framework, provider, package, plugin, connector, or recurring service.

The governing constraints are: greenfield WSL/Ubuntu delivery, Codex and Claude implementation, public no-account portfolio experience, synthetic-only evidence, isolated inquiry data, truthful bounded demonstrations, WCAG 2.2 AA, preview/production separation, reversible deployment, and a target launch ceiling of $50/month.

## First-party findings

| Area | Observed evidence | MTS implication |
|---|---|---|
| Application framework | Next.js App Router provides layouts, navigation, Server Components, Server Functions, route handlers, loading/error states, and current WSL support. The current installation guide requires Node.js 20.9+ and supports TypeScript, ESLint, Tailwind, App Router, and WSL. | Strong fit for the approved responsive public experience and server-side inquiry boundary. Still proposed, not approved. |
| Deployment | Next.js documents Node.js, Docker, static export, and adapters; Vercel is listed as a verified adapter. | Vercel is a strong deployment candidate for preview/production and rollback simplicity, but the exact plan and account posture still require approval. |
| Data and authorization | Supabase documents Postgres RLS as database-enforced authorization, requires grants and policies to be considered together, recommends tests for every exposed table, and warns that secret/service keys bypass RLS and must remain server-side. | Supabase is a strong fit for isolated inquiry persistence and RLS evidence testing. The deliberately vulnerable demonstration must not be an unrestricted public database path. |
| Email delivery | Resend requires a verified domain and API key, and provides Node.js and Next.js quickstarts plus email webhooks. | Resend is a strong candidate for operator notification, with the key kept server-side and delivery failures represented in the inquiry workflow. |
| Measurement | PostHog currently advertises a free monthly tier including 1M analytics events, with usage stopping at the free limit unless billing is enabled. | PostHog is a viable candidate, but a custom minimal event taxonomy must exclude inquiry content, secrets, and synthetic payloads. A first-party or self-hosted alternative remains a fallback. |
| Browser verification | Playwright Test supports Chromium, WebKit, and Firefox, CI, screenshots, visual comparisons, HTML reports, WSL, and current Node runtimes. | Strong fit for responsive, interaction, recovery, and reference-verification evidence. |

## Candidate architecture

### Preferred candidate — proposed

- **Application:** Next.js App Router with TypeScript.
- **Hosting and release:** Vercel preview and production environments, with repository-driven deployments and rollback to a prior deployment.
- **Data:** Supabase Postgres for inquiry records and bounded synthetic fixtures only where persistence materially improves evidence; RLS and grants tested in migrations/SQL tests.
- **Inquiry delivery:** Resend server-side notification path; no credentials or personal inquiry content in client telemetry.
- **Measurement:** Minimal PostHog event taxonomy, or a first-party event endpoint if privacy review rejects third-party analytics.
- **Verification:** Playwright Test plus accessibility and dependency/secret checks selected during Gate 5 approval.
- **Synthetic evidence safety:** Prefer deterministic application-level fixtures and isolated server-side scenario execution. Do not deploy a reusable vulnerable public endpoint. A documented “vulnerable” result must be generated from a bounded fixture/test harness with explicit limitations.

### Material alternative A — lower-service footprint

Next.js plus Vercel with static or build-time report content, server-side inquiry handling through a single route, and no persistent Supabase dependency until inquiry volume requires it. This reduces cost and data exposure, but weakens the credibility and directness of the RLS/data-isolation demonstration.

### Material alternative B — self-hosted or containerized deployment

Next.js in Docker with Postgres and email/analytics integrations selected independently. This improves portability but adds operations, backups, monitoring, patching, and rollback burden that is not justified for the low-traffic R1 portfolio product unless Vercel or Supabase constraints become disqualifying.

## Security and privacy conclusions

1. The public site must never expose a live reusable cross-tenant exploit path.
2. Inquiry persistence must be isolated from public synthetic evidence data.
3. Any private Supabase key must remain server-side; public keys are not authorization controls.
4. RLS tests must cover grants and policies, allow/deny behavior, and the exact roles used by the application.
5. Analytics must receive event names and bounded metadata only; never inquiry free text, credentials, private keys, or raw evidence payloads.
6. Resend delivery failures must not convert an inquiry acknowledgement into an engagement acceptance.
7. Preview, test, and production data must be separated, with reset/reseed commands unable to target production inquiry data.

## Cost posture

- Supabase Free is $0/month but may pause inactive projects; Pro is listed at $25/month and includes $10/month in compute credits.
- PostHog advertises a free tier with 1M analytics events per month.
- Vercel pricing must be checked against the owner’s actual account plan and usage before approval; the candidate remains within the $50 target only if existing account costs and usage allowances cover the deployment.
- Resend pricing and sending limits must be confirmed against the intended domain and low-volume inquiry notification pattern before approval.

The likely launch posture is either existing-account incremental cost near $0 or a Supabase Pro-centered path near $25/month. This is an estimate, not a billing guarantee.

## Recommendation gate

The preferred candidate is recommended for Gate 5 comparison and owner approval because it best matches the approved MPS/MDS workflow and Josh’s WSL/Ubuntu implementation context. Approval must explicitly cover the framework/runtime, hosting model, Supabase persistence and RLS testing, Resend notification, measurement choice, Playwright verification, and bounded synthetic evidence rule.

## Sources

- Next.js App Router: https://nextjs.org/docs/app
- Next.js installation and system requirements: https://nextjs.org/docs/app/getting-started/installation
- Next.js deployment options and verified adapters: https://nextjs.org/docs/pages/getting-started/deploying and https://nextjs.org/docs/app/guides/deploying-to-platforms
- Vercel pricing: https://vercel.com/pricing
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase pricing: https://supabase.com/pricing
- Resend introduction: https://resend.com/docs/introduction
- PostHog pricing: https://posthog.com/pricing
- Playwright installation and capabilities: https://playwright.dev/docs/intro
