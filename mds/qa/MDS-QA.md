# Supabase SaaS Launch-Readiness Lab — MDS QA Protocol

Status: Approved — implementation execution pending  
MDS version: v1.0  
Target: WCAG 2.2 AA

## Purpose

This protocol validates implemented experience quality against MDS v1.0. It does not replace MPS product acceptance or MTS architecture, security, integration, recovery, and operational verification.

Allowed results: `PASS`, `PASS WITH APPROVED EXCEPTIONS`, `REVIEW REQUIRED`, `FAIL`.

Finding classification: `GAP`, `EXCEPTION`, or `DEVIATION`; severity `critical`, `major`, `minor`, or `observation`.

Never claim exact, identical, or pixel-perfect fidelity unless a meaningful rendered comparison was performed.

## Preconditions

- Active MPS/MDS/MTS versions recorded.
- Repository build/test commands and environments recorded by MTS.
- Canonical references available.
- Implemented routes and states identified.
- Required design-delivery skills/tools verified by MTS.
- Test data is synthetic; no raw secret, credential, or customer record is exposed.

## Gate 1 — Foundation compliance

Verify and record evidence for:

- semantic token use and absence of unauthorized hardcoded design values
- Geist Sans/Mono loading, roles, weights, scale, and layout-shift behavior
- approved colors, semantic state mapping, and text/background contrast
- 4px spacing system, page gutters, section rhythm, and component interiors
- 6/10/14/pill radius use, border-first surfaces, restrained shadows
- approved product mark, secondary endorsement, and Lucide-style icons
- absence of shields, locks, bugs, hacker/neon/glass/decorative-dashboard treatment
- buttons/inputs/links and all required variants/states
- exact evidence vocabulary and icon + label + explanation + color rule
- shared-component reuse and **REUSE → COMPOSE → EXTEND → CREATE** discipline
- actual availability/use of MTS-required implementation and verification capabilities

Gate 1 fails for a material unapproved token system, inaccessible status meaning, prohibited claims, unsafe inquiry fields, or systemic one-off component duplication.

## Gate 2 — Visual fidelity

For each applicable reference, compare rendered output at the intended viewport. Record reference, route/state, screenshot/diff method, reviewer, date, and findings.

Evaluate page structure, maximum widths, grid/gutters, alignment, section spacing, hierarchy, whitespace/density, typography relationships, surfaces, component proportions, semantic emphasis, visual rhythm, CTA/evidence balance, and Do / Don't compliance.

Do not compare arbitrary generated sample text literally. Compare the system, hierarchy, composition, and required state.

| Reference | Required comparison |
|---|---|
| REF-001 | Foundations, state semantics, core component relationships |
| REF-002 | Landing narrative hierarchy and evidence-first posture |
| REF-003 | Shared component variants and states |
| REF-004 | Desktop/tablet/mobile composition transforms |
| REF-005 | Scenario context, optional path, cards, report route |
| REF-006 | Lab rail/canvas/context, evidence hierarchy, limitation/recovery |
| REF-007 | Report readability, severity, evidence, limitations, print |
| REF-008 | Inquiry labels, boundary, acknowledgement, failure/retry |
| REF-009 | Mobile order, action retention, touch treatment |

## Gate 3 — Product quality

### Responsive and content stress

Test at minimum 390, 640, 768, 960, 1280, and 1440 CSS px plus intermediate widths, browser zoom, text expansion, long labels, short/zero/many items, missing optional content, and evidence overflow.

Verify 4/2/1 scenario-card transformation, rail-to-selector change, context relocation, vulnerable-first mobile order, in-flow report/inquiry sidebars, matrix row identity during horizontal overflow, 24/32/48 gutters, and 44px touch targets.

### Interaction states

Exercise default, hover, focus, active, selected, disabled, loading, running, vulnerable, remediated, untested, not applicable, warning, unavailable, empty, invalid, submitting, failure, retry, acknowledgement, duplicate, and blocked unauthorized-request states where applicable.

Verify that old/unavailable evidence never becomes an implied pass and that focus moves only after deliberate navigation, submission, or recovery.

### Accessibility

- complete keyboard path through navigation, scenarios, tabs, evidence views, report, and inquiry
- visible focus and logical reading/tab order
- semantic headings, landmarks, lists, tables, forms, labels, descriptions, and errors
- accessible tabs/segmented controls and inactive-panel handling
- concise live announcements for running/completed/failed test and inquiry states
- status meaning without color or imagery
- AA contrast for text, controls, focus, and meaningful indicators
- reduced-motion behavior and no motion-dependent evidence
- text alternatives and readable technical evidence
- zoom/reflow without clipped content or lost action

### Runtime integrity

Record console, network, font, asset, hydration/layout-shift, and obvious interaction errors. Route functional/security failures to MPS/MTS while preserving their visible MDS state.

## Screen acceptance matrix

| Experience | Product trace | Required MDS evidence |
|---|---|---|
| Landing | ACC-001, 010 | Purpose/boundary, four pillars, proof path, report and CTA, responsive hierarchy |
| Scenario context/index | ACC-002 | Synthetic context, optional recommended path, distinct untested state, report route |
| Authorization/RLS | ACC-003–005 | Affected boundary, negative evidence, exact remediated state, matrix classifications, limitation |
| Storage/configuration | ACC-006 | Secret-safe proof, tested/not-tested distinction, remediation and limitation |
| Webhook integrity | ACC-007 | Replay/duplicate evidence, idempotent result, before/after, limitation |
| Reliability/recovery | ACC-008, 014 | Failure/retry/recovered/unavailable states, preserved context, return route |
| Findings/report | ACC-009, 010 | Severity, reproduction, impact, remediation, comparison, limitation, print/readability |
| Inquiry | ACC-011–013 | High-level fields, no secrets/uploads, failure vs acknowledgement, duplicate integrity, authorization stop |
| Cross-cutting safety | ACC-015 | No production credential, real customer record, raw secret, or upload required/exposed |

## Compliance report template

Record:

- project, feature/slice, release, MPS/MDS/MTS versions
- environment, commit/deployment, viewport/state coverage
- references reviewed and comparison method
- Gate 1/2/3 result and finding counts
- MPS acceptance evidence referenced
- MTS verification evidence referenced
- open gaps, approved exceptions, open deviations, blockers
- recommended MDS updates and required next action
- overall result and reviewer/date

## Release rule

R1 cannot receive MDS `PASS` while a critical/major deviation is open, a required viewport/state is untested, a required design-delivery capability is unavailable without approved fallback, or a prohibited claim/safety-boundary violation exists.

Implementation QA begins only after MTS supplies the repository commands, environments, and verification tooling. Until then, this protocol is implementation-ready but not executed.
