# Supabase SaaS Launch-Readiness Lab — Security Architecture

Status: Gate 7 implementation-readiness draft
This is an engineering control plan, not a certification.

## Actors and data

- Public buyer: reads public content, runs bounded synthetic scenarios, submits an inquiry.
- Josh/operator: receives and manages inquiry records through approved operational access.
- External services: Vercel, Supabase, Resend, and optional PostHog.
- Data: public synthetic evidence, inquiry contact data, delivery metadata, restricted secrets.

## Trust boundaries

1. Browser and Next.js application.
2. Next.js server and synthetic evidence executor.
3. Next.js server and Supabase inquiry store.
4. Next.js server and Resend API.
5. Browser/server measurement boundary and optional analytics provider.
6. Repository/build/deployment and runtime secrets.

## Controls

- Validate inquiry input server-side with an explicit schema.
- Apply rate limiting or abuse controls before persistence and notification.
- Deduplicate using a bounded key; never create duplicate engagement implications.
- Enforce RLS and grants for every exposed table; test allow/deny paths.
- Keep service keys server-only and exclude secrets from logs, analytics, URLs, screenshots, and evidence.
- Verify webhook authenticity if any email/provider webhook is used; handle replay, ordering, retries, and idempotency.
- Keep production inquiry data separate from synthetic fixtures and reset commands.
- Retain inquiry content for 12 months after latest activity or delete earlier; retain only minimal operational metadata afterward.
- Use preview-safe notification destinations and separate environment variables.
- Pin/manage dependencies through the repository lockfile and review supply-chain changes.

## Vulnerable demonstration rule

The product may demonstrate a truthful documented vulnerable state, but the deployed public application must not expose a reusable cross-tenant exploit path. Evidence must come from a bounded fixture/test harness or isolated execution boundary, be deterministic and resettable, and display its limitation beside the result.

## Recovery

- Failed scenario execution exposes retry/recovery/unavailable states.
- Inquiry delivery failure preserves the inquiry record and exposes an unconfirmed/retry path without promising engagement.
- Preview is the release checkpoint; production promotion is owner-controlled.
- Rollback returns to the last known-good deployment and does not destroy inquiry records.

## Verification evidence

Required evidence includes authorization allow/deny tests, secret/log scans, dependency results, inquiry duplicate/failure tests, synthetic reset tests, webhook replay/idempotency tests if implemented, preview browser reports, and manual confirmation that prohibited R1 paths are absent.
