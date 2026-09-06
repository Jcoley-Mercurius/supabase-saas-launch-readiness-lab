# Supabase SaaS Launch-Readiness Lab — MDS Implementation Manifest

Status: Approved — Gate 7 complete  
System: Mercurius Design System v1.0  
Product: MPS v1.1  
Date: 2026-09-05

## Authority map

| Resource | Path |
|---|---|
| MDS state | `mds/MDS-PROJECT-STATE.yaml` |
| Design specification | `mds/specification/DESIGN-SYSTEM.md` |
| Principles | `mds/specification/PRINCIPLES.md` |
| Do / Don't | `mds/specification/DO-DONT.md` |
| Canonical tokens | `mds/tokens/tokens.json` |
| Component decisions | `mds/COMPONENTS-PROPOSAL.md` |
| Composition decisions | `mds/COMPOSITION-PROPOSAL.md` |
| Reference reconciliation | `mds/REFERENCE-RECONCILIATION.md` |
| QA protocol | `mds/qa/MDS-QA.md` |
| Agent instructions | `AGENTS.md` |

## Repository status

No application repository is present in this workspace. Runtime paths must not be invented. MTS must inspect or initialize the implementation repository and resolve the following before build work:

- framework/version and language
- package/workspace structure
- styling and component systems
- runtime token and global-style locations
- font and icon loading
- shared component and layout paths
- data, authentication/authorization, tenancy, secrets, inquiry, observability, analytics, recovery, and deployment architecture
- testing/accessibility/browser/screenshot tools
- `mts/AGENT-SKILL-MANIFEST.yaml`

After repository selection, update this manifest with observed paths and mark each mapping current.

## Canonical references

| ID | Path | Implementation contract |
|---|---|---|
| MDS-REF-001 | `mds/references/core-design-system-v2.png` | Identity, palette, type relationships, spacing, radius, state language |
| MDS-REF-002 | `mds/references/landing-desktop-v1.png` | Public narrative hierarchy and CTA balance |
| MDS-REF-003 | `mds/references/component-library-v2.png` | Shared components and state treatments |
| MDS-REF-004 | `mds/references/layout-behavior-v1.png` | Desktop/tablet/mobile transformations |
| MDS-REF-005 | `mds/references/scenario-index-desktop-v2.png` | Synthetic context and scenario discovery |
| MDS-REF-006 | `mds/references/guided-rls-desktop-v2.png` | Evidence-first lab workspace |
| MDS-REF-007 | `mds/references/audit-report-desktop-v1.png` | Report hierarchy and limitation framing |
| MDS-REF-008 | `mds/references/inquiry-desktop-v1.png` | Inquiry fields and feedback/recovery states |
| MDS-REF-009 | `mds/references/mobile-experience-v4.png` | Mobile reading order and essential action retention |

## Foundation implementation order

1. Import approved design tokens into the runtime token mechanism selected by MTS.
2. Load Geist Sans and Geist Mono with stable fallbacks and no avoidable layout shift.
3. Establish canvas/base/muted/evidence surfaces, strong/muted/inverse text, borders, focus ring, semantic states, spacing, radii, and motion.
4. Implement accessible icon wrapper and exact evidence-state vocabulary.
5. Implement controls and form validation states.
6. Implement evidence primitives: panel, code/log, status, limitation, matrix, comparison, finding, scenario card.
7. Implement navigation, containers, grids, scenario rail/selector, report index, and page shells.
8. Validate foundation and component references before feature slices.

## Build-roadmap design inputs

| Slice | Product trace | Design dependencies | Required states | Canonical references | Visual/accessibility gate |
|---|---|---|---|---|---|
| 0. Foundation and public shell | REQ-001, 009, 013, 014 | Tokens, fonts, mark, header/footer, buttons, links, limitation | default, hover, focus, active, disabled, loading | REF-001, 003, 004 | Foundation QA; header/CTA keyboard and responsive checks |
| 1. Landing and scenario index | REQ-001, 002, 009 | Marketing shell, risk pillars, scenario cards, synthetic boundary, progress language | empty/untested, selected, focus | REF-002, 005, 009 | Report-first and single-scenario routes; no implied coverage |
| 2. Shared lab framework | REQ-002, 008, 009, 012 | Rail/selector, stepper, evidence panel, comparison, limitation, recovery | running, vulnerable, remediated, untested, unavailable, not applicable | REF-003, 004, 006, 009 | Desktop/tablet/mobile order; live announcements; preserved context |
| 3. Authorization and RLS | REQ-003, 004, 008 | Boundary context, negative proof, RLS matrix, before/after | vulnerable, running, remediated, unavailable | REF-006, 007, 009 | ACC-003–005; matrix labels; code accessibility/redaction |
| 4. Storage and configuration | REQ-005, 008 | Evidence panel, finding, secret-safe excerpt, limitation | vulnerable, remediated, untested, unavailable | REF-003, 007 | ACC-006; no real secret; explicit tested/not-tested scope |
| 5. Webhook integrity | REQ-006, 008 | Event evidence, idempotency result, comparison, limitation | first delivery, duplicate/replay, remediated, unavailable | REF-003, 007 | ACC-007; no duplicate commitment implication |
| 6. Reliability and recovery | REQ-007, 008, 012 | Failure/retry/recovery panel and return route | failure, timeout, retrying, recovered, unavailable | REF-003, 004, 007 | ACC-008/014; recovery and limitation visible |
| 7. Sample report and case study | REQ-008, 009 | Reading shell, section index, findings, severity, matrix, print behavior | expanded/collapsed, unavailable, print | REF-007, 009 | ACC-009/010; printable; report route without completion |
| 8. Authorized-review inquiry | REQ-010–014 | Form, authorization boundary, validation, acknowledgement, retry, duplicate notice | initial, partial, invalid, submitting, failed, acknowledged, duplicate, blocked request | REF-008, 009 | ACC-011–013; no secrets/uploads/promises; logical focus |
| 9. Combined experience QA | ACC-001–015 | All approved MDS | content stress and all prior states | REF-001–009 | Three MDS QA gates plus MPS/MTS validation |

MTS owns the final slice order where architecture or security dependencies require adjustment. It must preserve MPS scope and these design prerequisites.

## Responsive contract

- Breakpoints: 0/640/960/1280.
- Runtime paths: MTS/repository inspection to resolve.
- Wide lab: 240–264 rail + flexible evidence + optional 280–320 context.
- Below 960: in-flow selector; context before proof.
- Mobile: evidence-preserving single-column order from vulnerable proof through limitation and recovery.
- Report and inquiry sidebars move inline below desktop.
- Matrices may scroll only with row identity/status labels preserved.
- Minimum 44 × 44 CSS-pixel primary touch targets.

## Accessibility implementation

Target WCAG 2.2 AA. MTS must select actual validation tools. Implementation must provide semantics, headings/landmarks, labels/descriptions, error association, keyboard behavior, visible focus, accessible tabs, live status announcement, reduced motion, sufficient contrast, table semantics, and text alternatives.

## Design-delivery capability signals for MTS

| Signal | Applies to | Stage | Evidence required | Consequence if unavailable |
|---|---|---|---|---|
| Canonical component composition | REF-001, 003; all slices | foundation/components | Shared primitives demonstrably match tokens/states | Stop feature UI; avoid one-off copies |
| Responsive browser inspection | REF-004, 009; slices 1–9 | per slice and QA | Rendered checks at mobile/tablet/desktop plus intermediate widths | Slice cannot pass MDS QA Gate 3 |
| Accessibility validation | MDS accessibility; slices 0–9 | per slice and combined QA | Keyboard, semantics, focus, contrast, reduced-motion and automated evidence | Slice remains review-required |
| Screenshot/reference comparison | REF-001–009 | foundation, canonical screens, combined QA | Recorded visual comparisons and reviewed diffs | MDS QA Gate 2 cannot pass |
| Secret-safe evidence inspection | MPS-REQ-005/013; slices 3–6/9 | implementation and QA | Evidence/log review proves no raw secret/credential/customer data | Release blocker; route to MTS security |
| Image/reference preservation | REF-001–009 | repository setup and QA | Canonical assets available at stable paths | Stop visual implementation until restored |

MTS must choose, approve, install, and verify the specific skills/tools/providers. This MDS records capabilities and evidence only.

## Exceptions, gaps, and status

- Approved MDS exceptions: none
- Open MDS gaps: none
- Implementation deviations: not assessable until implementation exists
- High-level status: design-approved; implementation not started; repository/MTS mapping pending

## Maintenance

Update this manifest whenever MDS version, canonical paths, references, tokens, component locations, implementation paths, gaps, exceptions, or QA tooling changes. Reference the approved MTS Agent Skill Manifest when present; never duplicate its selections as MDS authority.

## Agent quick reference

Read MPS → MDS state/spec/tokens → this manifest → references → MTS state/skill manifest → repository. Use **REUSE → COMPOSE → EXTEND → CREATE**. Report gaps; do not invent. Run checks; never assume a pass.
