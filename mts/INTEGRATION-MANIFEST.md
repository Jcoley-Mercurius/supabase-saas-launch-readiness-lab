# Supabase SaaS Launch-Readiness Lab — MTS Integration Manifest

Status: Gate 7 implementation-readiness draft
Repository status: greenfield; paths below are approved planned paths, not yet inspected implementation paths.

| Integration | Planned path | Environment values | Server/client boundary | Tests/evidence |
|---|---|---|---|---|
| Next.js application | src/app/, src/components/, src/lib/ | NEXT_PUBLIC_SITE_URL may be public; private values server-only | Public rendering and client interaction separated | lint, typecheck, build, Playwright |
| Supabase client | src/lib/supabase/ | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; server-only secret key only if later justified | Publishable key may be client-visible; secret key never client-visible | migrations, RLS tests, negative authorization tests |
| Inquiry route | src/app/api/inquiries/route.ts | SUPABASE_SERVICE_ROLE_KEY only if approved server operation requires it; RESEND_API_KEY; INQUIRY_NOTIFICATION_TO | Server-only | schema validation, rate-limit, duplicate, delivery-failure tests |
| Evidence engine | src/lib/evidence/ | No secrets required | Server-side execution preferred; only qualified result crosses to UI | deterministic fixtures, reset/reseed, state transition tests |
| Resend | src/lib/email/ | RESEND_API_KEY, RESEND_FROM_EMAIL | Server-only | mocked delivery, failure/retry, no-sensitive-log check |
| Measurement | src/lib/measurement/ | Optional PostHog key only after approval; no private key in browser | Event boundary strips prohibited fields | taxonomy and payload-redaction tests |
| Playwright | playwright.config.ts, tests/ | Preview URL and test-only values | Test runner only | HTML report, screenshots, traces, responsive matrix |
| MDS assets | public/, mds/ preserved package | None | Static assets only | asset inventory and visual comparison |

## Planned database objects

- public.inquiries: minimal contact and inquiry metadata, retention timestamp, delivery status, deduplication key.
- public.inquiry_delivery_events: minimal operational delivery metadata; no message secrets.
- Synthetic evidence fixtures may use a separate schema or isolated project. They must not share production inquiry tables.

## External setup still required

Dashboard/account actions are owner-owned: create or select the Git repository, create Vercel project, create isolated Supabase environments, verify Resend domain, configure preview-safe notification destination, and add secrets privately. Values are never committed or pasted into prompts.
