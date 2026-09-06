# Supabase SaaS Launch-Readiness Lab — Composition Proposal

Status: Approved — Gate 4 complete  
MDS version: v0.1-draft  
Consumes: approved Gates 1–3

## Composition principles

- Public pages explain value quickly; lab pages preserve context during technical exploration.
- Evidence state, consequence, limitation, and recovery action remain visible at every viewport.
- The authorized-review CTA is consistently available but never competes with the evidence.
- The product feels like a guided engineering review, not a generic dashboard.

## Grid and containers

| Context | Maximum width | Grid |
|---|---:|---|
| Marketing/narrative | 1200 px | 12 columns, 24 px gap on desktop |
| Lab/evidence | 1360 px | Scenario rail + flexible evidence canvas + optional context panel |
| Reading/report prose | 760 px | Single readable column nested within the wider report shell |

Responsive grids use 8 columns with 20 px gaps on tablet and 4 columns with 16 px gaps on mobile. Approved gutters remain 48 px desktop, 32 px tablet, and 24 px mobile.

## Global navigation

- Left: compact product mark and Launch-Readiness Lab name.
- Center/right: Scenarios, Sample report, Method, and About the service.
- Primary action: **Discuss an authorized review**.
- Secondary endorsement: **Built by Josh Coley · Mercurius**; never equal in hierarchy to the product identity.
- Desktop keeps navigation visible and compact. Mobile uses an accessible menu while retaining direct access to the report and engagement CTA.

## Landing page shell

1. **Hero:** product promise, precise service boundary, primary “Explore the lab” action, secondary “View sample report,” and a compact evidence snapshot rather than decorative art.
2. **Launch-risk pillars:** authorization/RLS, storage/configuration, webhook integrity, and reliability/recovery.
3. **How the proof works:** synthetic context → negative test → remediation → repeated test → limitation.
4. **Scenario preview:** four scenario cards with expected proof and evidence-state vocabulary.
5. **Report preview:** severity-ranked finding sample and RLS matrix excerpt.
6. **Service boundary:** authorized work, synthetic-data posture, and explicit non-certification language.
7. **Engagement CTA:** explain the next conversation without promising timeline, price, finding, or outcome.

The landing page may use deep ink for the hero and framing. Primary reading sections remain light-first.

## Scenario index shell

- Introductory synthetic SaaS context: tenants, roles, protected resources, and representative payment events.
- A recommended path is visible but never required.
- Four primary scenario cards use consistent structure and state labels.
- The sample report remains reachable without scenario completion.
- Progress describes explored evidence, not product security coverage.

## Guided lab shell

### Wide desktop

- 240–264 px scenario navigation rail.
- Flexible central evidence canvas.
- Optional 280–320 px context panel for affected boundary, severity, and persistent limitation.
- The evidence canvas receives primary visual weight.

### Tablet

- Scenario rail becomes an in-flow selector above the evidence canvas.
- Context panel moves beneath the scenario heading and before the primary proof.
- Comparison may remain paired only when both panels retain usable width.

### Mobile

- Single-column guided flow.
- Scenario selector and step summary appear before evidence.
- Vulnerable proof precedes remediation, followed by a persistent comparison summary.
- Next step, report route, limitation, and retry actions remain visible in the natural reading order.

## Scenario detail hierarchy

1. Scenario title, pillar, affected boundary, and current evidence status.
2. Plain-language risk and what the documented test demonstrates.
3. Stepper: context → vulnerable proof → remediation → repeated test → limitation.
4. Evidence panel or matrix.
5. Before/after comparison.
6. Consequence and remediation direction.
7. Explicit limitation.
8. Next scenario, report, and authorized-review paths.

Running a demonstration changes the local evidence region, announces progress and completion accessibly, and never converts an old or unavailable result into a pass by implication.

## Audit report shell

1. Executive summary and synthetic scope.
2. Severity overview with explicit counts by documented state.
3. Findings ordered by launch risk and dependency—not merely color.
4. RLS coverage matrix.
5. Webhook and recovery evidence.
6. Remediation order and reference patterns.
7. Method, limitations, and what was not tested.
8. Case-study outcome and authorized-engagement CTA.

Desktop uses a sticky section index beside the report. Below desktop, it becomes an in-flow table of contents. The report must remain printable/readable without interactive controls or dark-page backgrounds.

## Inquiry shell

Desktop uses a two-column composition: expectations and authorization boundary on the left; concise form on the right. Mobile becomes one column with expectations before fields.

Required visual states:

- Initial and partially completed
- Inline validation
- Submitting
- Submission failed and retryable
- Acknowledged, with no implied engagement acceptance
- Duplicate submission linked to the original acknowledgement state
- Live-system request stopped at the authorization boundary

## Responsive thresholds

- Mobile: 0–639 px
- Tablet: 640–959 px
- Desktop: 960–1279 px
- Wide: 1280 px and above

Breakpoints represent composition changes, not device assumptions. Content must also survive intermediate widths, zoom, long labels, and text expansion.

## Interaction and focus behavior

- Keyboard focus follows the visible reading order.
- Tabs and segmented controls use appropriate arrow-key behavior; the main document tab order does not enter inactive panels.
- Focus moves only after deliberate navigation, submission, or recovery—not after ordinary status updates.
- Status changes announce concise results through an accessible live region while keeping the full explanation visible.
- Deep links open with scenario identity, scope, state vocabulary, and return path intact.
- Motion uses the approved 120–200 ms range and provides no essential meaning.

## Approved Gate 4 boundary

Container widths, grids, breakpoints, global navigation, landing hierarchy, scenario index, responsive guided-lab shell, scenario detail hierarchy, report shell, inquiry shell, and interaction/accessibility transformations are locked. Gate 5 visual references must consume these approved rules.
