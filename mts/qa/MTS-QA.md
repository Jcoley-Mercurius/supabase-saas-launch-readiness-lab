# Supabase SaaS Launch-Readiness Lab — MTS QA Protocol

Status: Gate 7 implementation-readiness draft

## Required automated checks

- format, lint, typecheck, and build;
- unit and integration tests for evidence, inquiry validation, dedupe, replay, and recovery;
- Supabase migration and RLS allow/deny tests;
- Playwright browser, responsive, route, screenshot, and recovery tests;
- secret/log/dependency checks;
- measurement payload-redaction tests.

## Required manual checks

- verify every canonical asset and token loads;
- compare landing, scenario, guided lab, report, inquiry, and mobile behavior to approved MDS references;
- keyboard, focus, semantics, contrast, and reduced-motion review;
- mobile, tablet, desktop, wide, zoom, long-content, and text-expansion review;
- browser console, network, font, and asset review;
- verify vulnerable evidence is bounded and no live reusable exploit path exists;
- submit inquiry success, duplicate, validation failure, delivery failure, retry, and acknowledgement cases;
- verify production promotion and rollback procedure without deleting inquiry data.

## Gate evidence

Each check is recorded as pass, fail, or not_run with command, environment, timestamp, artifact, and owner. No security, compliance, certification, or launch-readiness claim is made from an unrun check.
