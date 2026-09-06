# Supabase SaaS Launch-Readiness Lab — MTS Gate 6 Technology Approval

Project ID: `supabase-saas-launch-readiness-lab`  
MTS version: `v0.5-draft`  
Gate: 6 — Approval  
Status: Ready for final Gate 6 confirmation  
Recommendation approval: Josh Coley, recorded 2026-09-06

## Approved technology decision set pending Gate 6 confirmation

The Gate 5 recommendation is approved for formal technology selection review. The following set is intentionally coherent and limited to the R1 product boundary.

| Area | Proposed selection | Decision type | Scope |
|---|---|---|---|
| Application | Next.js App Router + TypeScript | Persistent framework dependency | Public responsive application, route handlers, server-side boundaries |
| Hosting | Vercel preview and production | Persistent deployment service | Repository-driven builds, environment separation, rollback |
| Data | Supabase Postgres | Persistent data service | Inquiry persistence and bounded synthetic evidence data only |
| Authorization | PostgreSQL grants + Supabase RLS | Security architecture rule | Tested allow/deny behavior; no public reusable exploit path |
| Inquiry delivery | Resend | Persistent delivery service | Server-side operator notification after verified domain setup |
| Measurement | First-party measurement boundary; PostHog conditional | Privacy-scoped integration | Bounded event taxonomy; no inquiry content or secrets |
| Verification | Playwright Test | Required QA dependency | Browser, responsive, recovery, screenshot, and cross-browser evidence |
| Evidence execution | Custom bounded synthetic scenario engine | Required custom implementation | Deterministic, resettable, isolated, explicitly qualified evidence |
| Agent workflow | MTS/MPS/MDS project instructions plus selected stage-specific guidance | Engineering workflow | Codex and Claude consume canonical project artifacts; cross-agent skill parity is not assumed |

## Non-selections

- No live scanning or third-party target testing.
- No production credentials, customer uploads, buyer accounts, billing, or real payment processing.
- No public vulnerable Supabase endpoint.
- No automatic installation of plugins, connectors, MCP servers, or security products.
- No analytics collection of inquiry text, secrets, credentials, or raw evidence payloads.
- No CMS, AI execution, client portal, or expanded customer-specific scenarios in R1.

## Security and operational approval rules

1. Private keys and service-role credentials remain server-side and outside evidence, logs, analytics, screenshots, URLs, and source control.
2. Inquiry storage is isolated from synthetic scenario data and follows the approved 12-month retention/deletion policy.
3. Preview, test, and production environments use separate configuration and data boundaries.
4. RLS work includes grants, policies, positive tests, negative tests, and role-specific verification.
5. Scenario reset/reseed commands cannot target production inquiry data.
6. Email delivery failure, retry, duplicate, and unconfirmed states remain visible and truthful.
7. The application never claims certification, formal penetration testing, compliance, or guaranteed launch readiness.
8. Technology approval does not expand MPS scope or override MDS visual and interaction authority.

## Cost approval boundary

The architecture is approved against the $50/month launch posture, subject to account-level confirmation before paid production activation. Supabase Pro is a possible $25/month baseline when its operational benefits are required; free tiers may be used for testing when they do not weaken evidence or reliability. Vercel, Resend, and optional PostHog costs remain usage/account-dependent.

No paid upgrade, external account connection, domain configuration, or production secret activation is authorized by this record alone. Those are implementation-stage owner actions.

## Gate 6 confirmation

Final confirmation should approve the complete technology decision set above. Once confirmed, MTS will:

- mark Gate 6 complete;
- propagate approved selections into the technology blueprint, integration manifest, security architecture, and Agent Skill Manifest;
- begin Gate 7 implementation-readiness packaging;
- retain unresolved account setup and repository bootstrap as implementation prerequisites rather than hidden assumptions.

## Authority and evidence

- Product authority: `mps/MPS-PROJECT-STATE.yaml` — MPS `v1.1`
- Design authority: `mds/MDS-PROJECT-STATE.yaml` — MDS `v1.0`
- Capability authority: `mts/SUPABASE-LAUNCH-READINESS-CAPABILITY-MATRIX.md`
- Research authority: `mts/GATE-4-RESEARCH.md`
- Recommendation authority: `mts/GATE-5-RECOMMENDATION.md`
