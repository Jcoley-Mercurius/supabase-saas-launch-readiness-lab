# Supabase SaaS Launch-Readiness Lab — MTS Capability Matrix

Project ID: `supabase-saas-launch-readiness-lab`  
MTS artifact ID: `MTS-CAPABILITY-MATRIX-SUPABASE-LAUNCH-READINESS`  
Status: Proposed for Gate 3 approval  
MTS version: `v0.2-draft`  
Consumed authority: MPS `v1.1`; MDS `v1.0`

> This is the project-scoped capability matrix for the **Supabase SaaS Launch-Readiness Lab**. Its project ID and artifact ID are authoritative for identity and traceability.

## Mapping rules

- This matrix defines needs, boundaries, and research questions. It does not approve providers, frameworks, packages, schemas, or deployment services.
- MPS defines the product and release boundary. MDS defines the experience, states, responsive behavior, and accessibility contract. MTS owns the later technical selections.
- Every public demonstration uses synthetic data. A vulnerable state must be truthful but must not expose a reusable public exploit path.
- Production services, SDKs/packages, custom product code, agent skills, plugins/connectors, and MCP servers remain separate approval layers.

## Required capabilities

| ID | Capability and affected users | Sources | Data and trust boundary | Required MDS behavior | Delivery decision at Gate 3 | Dependencies and principal risks |
|---|---|---|---|---|---|---|
| MTS-CAP-001 | Responsive public application delivery for all visitors | MPS-REQ-001, 009; MPS-ACC-001, 010; MDS v1.0 | Public content across browser → application/runtime → asset delivery | Approved navigation, shells, tokens, canonical layouts, responsive transformations, loading/error paths | `build/buy research required`: product UI will be custom implementation; runtime, framework, hosting, and packages remain unselected | Depends on deployment and content delivery. Risk: framework convenience overrides MDS composition. |
| MTS-CAP-002 | Bounded synthetic tenant and authorization evidence for technical buyers | MPS-REQ-002–004; MPS-ACC-002–005 | Synthetic tenants, roles, resources, and test results across browser → application → isolated evidence/data boundary | Scenario stepper, status indicator, RLS matrix, vulnerable/remediated comparison, limitations, running/unavailable states | `custom implementation required`; data/runtime candidates require Gate 4 research | Critical risk: a deliberately vulnerable public backend becomes exploitable. Evidence must be deterministic, isolated, resettable, and scoped to the documented scenario. |
| MTS-CAP-003 | Secret-safe storage and configuration evidence | MPS-REQ-005, 013; MPS-ACC-006, 015 | Synthetic configuration and redacted evidence; restricted secrets never cross into client, artifacts, telemetry, or screenshots | Evidence panel, code/log excerpt, finding summary, limitation callout, unavailable state | `custom implementation required`; any storage/service/package remains unselected | Depends on redaction and secret-management controls. Risk: example or operational secrets leak through evidence/logs. |
| MTS-CAP-004 | Webhook replay and idempotency evidence | MPS-REQ-006; MPS-ACC-007 | Synthetic event enters an event-handler boundary and reaches an isolated idempotency ledger | Replay control, running state, duplicate result, before/after comparison, explicit documented-scenario limitation | `custom implementation required`; event persistence/runtime/package candidates require research | Depends on deterministic logical event IDs and atomic deduplication. No real payment processing. Risk: duplicate commitments or misleading simulation. |
| MTS-CAP-005 | Failure injection and recovery evidence | MPS-REQ-007, 012; MPS-ACC-008, 014 | Controlled synthetic failure across application → evidence execution/state store | Loading, failure, retry, recovery, unavailable, alternate route, and live announcements | `custom implementation required`; execution and state-persistence approach requires research | Must isolate failure injection from production operations. Risk: non-deterministic demos or recovery claims not supported by evidence. |
| MTS-CAP-006 | Report and case-study publication | MPS-REQ-008–009; MPS-ACC-009–010; MDS-REF-007 | Public findings and synthetic evidence across application/content delivery → browser/print | Severity-ranked findings, report hierarchy, printable output, CTA, adjacent limitations | `custom implementation required`; content storage/build-time strategy requires research | Depends on CAP-002–005 evidence model. Risk: stale report diverges from scenario truth. |
| MTS-CAP-007 | Privacy-aware inquiry capture and operator handling | MPS-REQ-010–015; MPS-ACC-011–016 | Personal inquiry data crosses browser → server validation → data store → notification/delivery → Josh; public and operator access are separate | Visible labels, validation, submitting, confirmed, unconfirmed, duplicate, retry, privacy, and authorization-boundary states | `build/buy research required`: custom workflow plus production persistence/delivery/abuse controls; no buyer account | Depends on retention/deletion, server-side validation, deduplication, abuse resistance, and secret-safe delivery. Risk: duplicate engagement implication, spam, excess retention, or contact leakage. |
| MTS-CAP-008 | Privacy-safe product measurement | MPS-MET-001–005; MPS-RULE-007 | Minimal interaction events across browser/server → measurement store; no secrets, synthetic payloads, or free-form inquiry content | Consent/loading impact only if chosen technology requires it; no decorative analytics in product UI | `build/buy research required`; event taxonomy will be custom, collection/storage provider unselected | Must distinguish unique visitors, scenario completions, qualified inquiries, and proposal reuse without inflating duplicates. Risk: telemetry collects personal or sensitive content. |
| MTS-CAP-009 | Accessible responsive and reference verification | MDS-CAPSIG-002–004; MDS QA | Test runner/browser → preview application; screenshots and reports are engineering evidence | Keyboard, focus, semantics, contrast, reduced motion, text expansion, responsive widths, reference comparison | `tool/package/agent-skill research required` | Depends on preview environment and canonical assets. Release blocker when required states/viewports are untested. |
| MTS-CAP-010 | Secret, log, and dependency safety verification | MPS-REQ-013; MPS-ACC-015; MDS secret-safe evidence signal | Repository/build/runtime/log boundaries; restricted values remain outside output and artifacts | Failures must not surface secrets; evidence-unavailable state used when proof cannot safely render | `tool/package/agent-skill research required` | Risk: unsafe logs, vulnerable dependencies, or false security claims. Scanning tools do not authorize third-party testing. |
| MTS-CAP-011 | Preview, production, CI, release, and rollback controls | Approved repository posture; MDS implementation stages; MPS release intent | Source repository → CI/build → preview → production | Canonical assets/fonts load; preview supports full visual and interaction QA | `production service/package research required` | Standalone repository does not yet exist. Deployment must be reversible and environment variables separated. |
| MTS-CAP-012 | Operator data operations for inquiry retention and recovery | MPS-REQ-015; MPS-ACC-016 | Josh-only operator path → inquiry store and delivery metadata | No public admin UI is required; deletion/recovery outcomes need operational evidence | `custom implementation plus service research required` | Depends on least-privilege operator access, auditability, 12-month expiry, earlier manual deletion, and minimal residual deduplication metadata. |
| MTS-CAP-013 | Deterministic fixtures, automated tests, and reset/reseed controls | MPS-ACC-002–016; MPS/MDS QA | Test/seed tools → isolated synthetic stores and preview/test environments | All canonical states can be reached reproducibly without hidden shortcuts | `custom implementation plus test-package research required` | Underpins CAP-002–007. Reset must never target production inquiry data or broad environments. |

## Optional and deferred capabilities

| ID | Status | Capability | Product boundary and Gate 3 disposition |
|---|---|---|---|
| MTS-CAP-014 | optional | Static downloadable report artifact | A print-friendly web report is required; a separately generated PDF is optional only if it improves Upwork reuse without introducing content drift. Research after the canonical report architecture. |
| MTS-CAP-015 | optional | Lightweight uptime/error alerting beyond platform-native visibility | Useful after deployment if free/low-cost and privacy-safe. It must not delay R1 or create unsupported availability claims. |
| MTS-CAP-016 | deferred | Expanded scenario library and customer-specific evidence | R2+ only. Any buyer-specific target, data, credentials, or evidence requires a separate MPS authorization/scope decision. |
| MTS-CAP-017 | deferred | Client workspace, saved audits, collaboration, or longitudinal reports | Explicitly outside R1 and requires MPS approval before capability research. |

## Not applicable to R1

| Family | Status | Reason |
|---|---|---|
| Buyer identity, authentication, entitlements, and client accounts | not applicable | R1 is public and no-account. Operator-only access controls may still be needed for inquiry operations. |
| Real payments, billing, tax, invoices, and subscriptions | not applicable | Webhook/payment state is synthetic evidence only. No money moves through the lab. |
| Buyer uploads and customer-data ingestion | not applicable | Prohibited by the approved R1 boundary. |
| Live scanning, penetration-testing execution, or third-party target integration | not applicable | The lab demonstrates synthetic or explicitly authorized proof and does not itself authorize testing. |
| AI model execution, retrieval, or autonomous risk scoring | not applicable | No approved R1 requirement; adding it would create cost, safety, evidence-integrity, and policy burdens. |
| CMS/editorial workflow | not applicable | R1 has a fixed, operator-maintained report/case study; revisit only if an approved publishing need emerges. |
| Search, recommendations, geospatial, chat, SMS, push, and social collaboration | not applicable | No R1 requirement. |
| Feature flags and experimentation platform | not applicable | Release controls and deterministic scenario states are required; an experimentation service is not. |
| Formal compliance evidence or certification tooling | not applicable | Explicitly prohibited positioning. Technical test evidence remains scoped and qualified. |

## Layer separation for Gate 4 research

| Layer | Gate 3 need | Selection status |
|---|---|---|
| Production services | Runtime/hosting, data persistence, inquiry delivery, measurement, and operational visibility may require services | No provider approved; research candidates only after security/cost criteria are applied |
| SDKs/packages | Framework, validation, data access, testing, accessibility, visual comparison, and security tooling may require dependencies | No package approved |
| Custom implementation | Product UI, scenario orchestration, evidence model, webhook ledger behavior, report, event taxonomy, and inquiry workflow | Required in principle; architecture and repository paths unapproved |
| Agent skills | Framework/provider guidance, secure data architecture, implementation QA, browser validation, and deployment may benefit from selected skills | Candidates discovered; none approved for implementation |
| Plugin/app connectors | May help inspect or administer a chosen external service during implementation | None required or approved at Gate 3 |
| MCP servers | May provide bounded agent access to selected services or documentation | None required or approved at Gate 3 |

## Agent-capability inventory and research candidates

The project will use Codex and Claude, but cross-agent skill compatibility is not assumed. Gate 4 must verify source, currency, permissions, target environment, invocation, evidence, overlap, and fallback before Gate 5 recommends a minimal set.

| Candidate family | Maps to | Current evidence | Gate 3 status |
|---|---|---|---|
| Mercurius Product, Design, and Technology System skills | Governance and all capabilities | Available and already used in ChatGPT/Codex planning; canonical artifacts remain higher authority | observed methodology support; not an implementation-stack selection |
| Framework guidance | CAP-001, 006–007, 011 | A maintained Next.js skill is available in the current Codex environment, but no framework is approved and Claude compatibility is unverified | discovered; research only after framework candidates are evaluated |
| Hosting/deployment/environment guidance | CAP-001, 011 | Multiple maintained Vercel skills are available in the current Codex environment; no hosting provider is approved | discovered; avoid install-all overlap; select only stage-specific candidates after provider research |
| Data/auth/storage guidance | CAP-002–004, 007, 012–013 | No verified Supabase-specific implementation skill is present in the supplied project/current skill inventory | gap candidate for research; official documentation or project-local fallback may be sufficient |
| Security review guidance | CAP-002–004, 007, 010, 012 | Codex Security is an available but uninstalled plugin candidate; permissions and project fit are unknown | discovered plugin candidate; no connection or approval |
| Browser and end-to-end verification | CAP-009, 011, 013 | Browser-control and browser-verification skills are available in the current Codex environment | discovered; verify against eventual framework and preview workflow |
| React quality review | CAP-001, 009 | React review skill is available, conditional on a React-based stack | discovered; conditional and not selected |
| Accessibility and visual-regression verification | CAP-009 | MDS requires evidence, but no single dedicated candidate has been selected | research required; package/tool fallback must be defined |
| Database migration and webhook testing guidance | CAP-002, 004, 007, 012–013 | Need is traced; no candidate is verified for either coding-agent environment | research required |

## Gate 4 research questions

1. Which application/runtime/deployment combination satisfies the responsive MDS, preview/production separation, WSL workflow, low traffic, and $50 monthly ceiling with the least operational burden?
2. Which data architecture can execute real, deterministic negative authorization and idempotency tests while preventing an unrestricted public vulnerability and isolating inquiry data?
3. Should synthetic scenario execution be ephemeral, transactionally reset, or backed by pre-seeded isolated data—and how will the UI distinguish a live documented test from explanatory evidence?
4. Which inquiry persistence, notification, deduplication, abuse-control, deletion, and retention mechanism is reliable within the budget?
5. Which privacy-safe measurement approach supports the five approved metrics without free-form content or secret collection?
6. Which minimal automated-test, browser, accessibility, visual-comparison, dependency, and secret-scanning toolchain provides auditable release evidence?
7. Which agent skills are truly required or recommended for Codex and Claude, and what documented fallback applies when an equivalent skill cannot be verified in both environments?

## Gate 3 completion criteria

- Required, optional, deferred, and not-applicable capability classes are explicit.
- Each required capability traces to approved MPS/MDS authority.
- Data classes, trust boundaries, required user-facing states, dependencies, and primary risks are mapped.
- Technology layers are separated and no provider/package/skill is presented as approved.
- Agent capability candidates are inventoried without an install-all bundle.
- Gate 4 has bounded research questions and no unresolved MPS/MDS policy gap.
