# Supabase SaaS Launch-Readiness Lab

A public, no-account portfolio experience and **synthetic** audit lab that demonstrates
launch-blocking Supabase failure modes — authorization/RLS, storage and configuration, webhook
replay and idempotency, and reliability/recovery — and presents them as reproducible,
severity-ranked, buyer-readable evidence with an authorized-review inquiry path.

**Project ID:** `POB-2026-36-02` · **Release:** R1 — Portfolio Launch-Readiness Proof
**Owner / decision authority:** Josh Coley

---

## Current status

| System           | Version    | Lifecycle | Gate                                                                 |
| ---------------- | ---------- | --------- | -------------------------------------------------------------------- |
| MPS — Product    | v1.1       | approved  | Approval/handoff complete; product validation pending implementation |
| MDS — Design     | v1.0       | approved  | Gate 7 handoff complete                                              |
| MTS — Technology | v0.6-draft | draft     | Gates 1–6 complete; Gate 7 implementation-readiness in progress      |

**Application:** a baseline Next.js App Router scaffold is in place at the repository root with the
approved dependency set installed. No product feature, evidence engine, or design token has been
implemented yet — `app/` is still the unmodified starter page.

**Next action:** run the **P0 handoff-verification prompt** in
[mts/MERCURIUS-IMPLEMENTATION-PLAYBOOK.md](mts/MERCURIUS-IMPLEMENTATION-PLAYBOOK.md), then S1.
Open MTS Gate 7 blocking items: `p0_agent_verification`, `owner_external_account_setup`.

## Governance model

The lab is built under the Mercurius three-system method. Each system owns one concern and hands an
approved package to the next:

| System                                | Owns                                                                                                     | Canonical state                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **MPS** — Mercurius Product System    | Purpose, users, scope, workflows, requirements, business rules, acceptance, metrics, release intent      | [mps/MPS-PROJECT-STATE.yaml](mps/MPS-PROJECT-STATE.yaml) |
| **MDS** — Mercurius Design System     | Visual language, tokens, components, composition, interaction, responsive behavior, design accessibility | [mds/MDS-PROJECT-STATE.yaml](mds/MDS-PROJECT-STATE.yaml) |
| **MTS** — Mercurius Technology System | Framework, services, integrations, data/security architecture, deployment, operations, agent skills      | [mts/MTS-PROJECT-STATE.yaml](mts/MTS-PROJECT-STATE.yaml) |

[AGENTS.md](AGENTS.md) is the single instruction file for coding agents. It merges the product,
design, and technology contracts into one operating boundary and is **required reading before any
implementation work**. `CLAUDE.md` imports it and additionally hosts the Next.js-managed
`nextjs-agent-rules` block, which keeps that generated content out of the change-controlled
`AGENTS.md`.

> The `mps/`, `mds/`, and `mts/` directories and `AGENTS.md` are change-controlled. They are
> deliberately authored, excluded from Prettier, and must not be reformatted or edited by tooling
> or by an agent acting on its own judgment.

## Approved architecture (MTS Gate 6)

| Area               | Selection                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| Application        | Next.js App Router + TypeScript                                             |
| Hosting            | Vercel (preview + production)                                               |
| Data               | Supabase Postgres — inquiry persistence and bounded synthetic evidence only |
| Authorization      | PostgreSQL grants + Supabase RLS, with tested allow/deny behavior           |
| Inquiry delivery   | Resend, server-side, after verified domain setup                            |
| Measurement        | First-party measurement boundary; PostHog conditional                       |
| Verification       | Playwright Test                                                             |
| Evidence execution | Custom bounded synthetic scenario engine                                    |

Cost posture: a $50/month operating ceiling at launch. Full record in
[mts/GATE-6-APPROVAL.md](mts/GATE-6-APPROVAL.md).

## Getting started

Requires Node 24 and pnpm 12 (pinned via `packageManager`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

### Checks

| Command                             | Covers                              |
| ----------------------------------- | ----------------------------------- |
| `pnpm lint`                         | ESLint via `eslint-config-next`     |
| `pnpm typecheck`                    | `next typegen` then `tsc --noEmit`  |
| `pnpm build`                        | Production build                    |
| `pnpm format` / `pnpm format:check` | Prettier over application code only |
| `pnpm test:e2e`                     | Playwright browser verification     |

### Browser verification

`playwright.config.ts` is a baseline harness only — it asserts no product behavior. Viewport
projects match the approved MDS breakpoints (mobile 390, tablet 768, desktop 1200, wide 1440) and
run on Chromium and Firefox. `e2e/smoke.spec.ts` confirms the app serves and the pipeline runs;
scenario, evidence, report, and inquiry specs arrive with their own slices.

The per-test timeout is 60s because Next's dev server compiles routes on demand and parallel
workers otherwise exceed Playwright's 30s default on a cold start.

**WebKit runs in CI only.** Its binaries are installed here, but it needs 121 system packages on
this Ubuntu 26.04 host (the full GStreamer stack, Mesa, GTK4, ONNX Runtime). The owner decision is
to skip that local install and take WebKit evidence from a CI runner using a Playwright image that
ships the dependencies. Set `PLAYWRIGHT_WEBKIT=1` to add the `webkit-desktop` project:

```bash
PLAYWRIGHT_WEBKIT=1 pnpm test:e2e
```

The CI workflow itself is not wired yet — that belongs to S6 (release and combined verification),
along with recording this verification decision in the MTS canonical state.

`pnpm typecheck` runs `next typegen` first because Next generates route types (`LayoutProps` and
friends) into `.next/types`; a bare `tsc --noEmit` fails on a clean tree without it.

## Repository layout

```
AGENTS.md                     Merged agent operating contract (read first)
CLAUDE.md                     Imports AGENTS.md; hosts the Next.js-managed agent block
app/                          Next.js App Router source (starter scaffold)
public/                       Static assets
e2e/                          Playwright specs
playwright.config.ts          Browser-verification harness (MDS breakpoint projects)
next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs
.prettierrc.json/.prettierignore   Prettier scoped away from governance artifacts

mps/                          Product authority
  MPS-PROJECT-STATE.yaml      Canonical product state
  PRODUCT-BLUEPRINT.md        Purpose, promise, workflow, guardrails
  SCOPE-RELEASE-PLAN.md       R1/R2/R3 boundary and exclusions
  REQUIREMENTS-RULES.md       MPS-REQ-* and MPS-RULE-*
  ACCEPTANCE-CRITERIA.md      MPS-ACC-*
  WORKFLOW-CATALOG.md         Buyer workflows and states
  USER-ROLE-MODEL.md          Actors and permissions
  OUTCOMES-METRICS.md         MPS-OUT-* and MPS-MET-*
  implementation/, qa/

mds/                          Design authority
  MDS-PROJECT-STATE.yaml      Canonical design state
  specification/              DESIGN-SYSTEM.md, PRINCIPLES.md, DO-DONT.md
  tokens/tokens.json          Approved semantic tokens
  references/                 Canonical images MDS-REF-001..009
  references/archive/         Superseded references — never use as authority
  COMPONENTS-PROPOSAL.md, COMPOSITION-PROPOSAL.md, FOUNDATIONS-PROPOSAL.md
  REFERENCE-RECONCILIATION.md Reference-by-reference approval record
  implementation/, qa/

mts/                          Technology authority
  MTS-PROJECT-STATE.yaml      Canonical technology state
  TECHNOLOGY-BLUEPRINT.md     Approved architecture
  INTEGRATION-MANIFEST.md     External services and boundaries
  SECURITY-ARCHITECTURE.md    Secrets, RLS, isolation, retention
  AGENT-SKILL-MANIFEST.yaml   Required/recommended agent skills and fallbacks
  IMPLEMENTATION-PLAN.md      Slice plan
  MERCURIUS-BUILD-ROADMAP.md  Phase route and checkpoints
  MERCURIUS-IMPLEMENTATION-PLAYBOOK.md  One prompt per stage
  SUPABASE-LAUNCH-READINESS-CAPABILITY-MATRIX.md
  GATE-4-RESEARCH.md, GATE-5-RECOMMENDATION.md, GATE-6-APPROVAL.md
  qa/
```

## Build route

`P0 Bootstrap → S1 Public Shell → S2 Evidence/RLS → S3 Replay/Recovery → S4 Report → S5 Inquiry → S6 Combined QA/Release`

Each slice has its own prompt and checkpoint in the playbook. Run **one stage at a time** and stop
at every checkpoint. Details in [mts/MERCURIUS-BUILD-ROADMAP.md](mts/MERCURIUS-BUILD-ROADMAP.md).

## Owner prerequisites (not performed by an agent)

1. Git repository — exists: `Jcoley-Mercurius/supabase-saas-launch-readiness-lab`
2. Vercel project with separate preview and production environments
3. Isolated Supabase projects/environments for preview, test, and production
4. Verified Resend sending domain and a notification destination
5. Private environment values configured in the dashboards — **never** in source, prompts, logs, or commits

Production promotion, paid upgrades, and secret activation are explicit owner actions and are not
authorized by any document in this repository.

## Working rules

The mandatory workflow is **READ → TRACE → INSPECT → COMPARE → PLAN → APPROVE → IMPLEMENT → VALIDATE → REPORT**.

Non-negotiable boundaries:

- **Synthetic or explicitly authorized data only.** No production credentials, buyer uploads, or customer records.
- **No live scanning** and no reusable public vulnerable endpoint. A demonstration never authorizes third-party testing.
- **Distinct states.** Vulnerable, remediated, untested, unavailable, running, and not-applicable never collapse into one status.
- **No unqualified claims.** Never "secure", "certified", "compliant", "guaranteed", or bare "passed". Limitations stay adjacent to the claims they qualify.
- Canonical remediated label: **Remediated — documented test blocked**.
- Inquiry acknowledgement is not engagement acceptance; duplicates must not imply duplicate engagements.
- Inquiry content is retained no longer than 12 months after latest activity, isolated from synthetic fixtures, and excluded from analytics and logs.
- Target WCAG 2.2 AA. Never hide evidence state, limitation, recovery, report route, or the primary CTA for viewport size.
- Reuse before creating: **REUSE → COMPOSE → EXTEND → CREATE**. A new reusable visual convention is an MDS gap — report it, do not hide it.
- Never claim a check passed unless it ran and its result is recorded.

Every implementation slice traces to `MPS-REQ-*`, `MPS-RULE-*`, and `MPS-ACC-*`.

## Gap protocol

| Missing decision                                                        | Classification |
| ----------------------------------------------------------------------- | -------------- |
| Purpose, policy, scope, workflow, acceptance                            | MPS gap        |
| Visual, component, interaction, responsive, state, design accessibility | MDS gap        |
| Architecture, service, data/security, deployment, recovery, operations  | MTS gap        |
| Approved intentional implementation difference                          | Exception      |
| Unapproved difference                                                   | Deviation      |

Never resolve a gap by silently inventing behavior. Stop at the authority boundary and ask.

## Out of scope for R1

Live scanning · buyer uploads · production credentials or customer data · client accounts, portal,
billing, scheduling, contracts · formal penetration testing, certification, or compliance
attestation · automated buyer risk scoring · CMS or AI execution.

R2 may deepen evidence based on observed demand. R3 may introduce authorized client intake only
after separate MPS decisions on authorization, sensitive-data handling, pricing, and operations.
