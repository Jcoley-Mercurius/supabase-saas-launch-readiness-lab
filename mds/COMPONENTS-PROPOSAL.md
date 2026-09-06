# Supabase SaaS Launch-Readiness Lab — Component System Proposal

Status: Approved — Gate 3 complete  
MDS version: v0.1-draft  
Consumes: approved Gate 2 foundations

## Component strategy

Use **REUSE → COMPOSE → EXTEND → CREATE**. General controls remain quiet and familiar; project-specific components carry the evidence model. Every material state must remain understandable without color or animation.

## Core controls

| Component | Variants | Sizes | Required states |
|---|---|---|---|
| Button | primary, secondary, quiet, destructive, inverse | sm, md, lg | default, hover, focus, active, disabled, loading |
| Text input | default, search-like when locally needed | md | empty, populated, focus, disabled, invalid, valid |
| Textarea | default | md | empty, populated, focus, disabled, invalid |
| Select | default | md | closed, open, selected, focus, disabled, invalid |
| Checkbox | default, authorization confirmation | md | unchecked, checked, indeterminate, focus, disabled, invalid |
| Link | inline, navigation, standalone | sm, md | default, hover, focus, visited where helpful |

Primary actions use `brand.primary`; destructive styling is reserved for truly destructive or unsafe actions, not ordinary vulnerability evidence.

## Navigation and progress

| Component | Purpose | Required behavior |
|---|---|---|
| Global header | Product identity, report entry, service CTA | Compact, sticky only when it improves orientation; endorsement remains secondary |
| Scenario navigation | Move among the four proof pillars | Shows current scenario, completion/evidence state, and return to index |
| Scenario stepper | Context → vulnerable proof → remediation → repeated test → limitation | Current, complete, available, and blocked steps are explicit |
| Tabs/segmented control | Change evidence view | Never hides a material warning or limitation; keyboard-operable |
| Breadcrumb/back path | Preserve orientation | Required on deep scenario and report views |

## Evidence-state system

The canonical evidence-state component combines icon, label, semantic color, concise explanation, and optional timestamp/test identifier.

| State | Canonical label | Icon/shape | Meaning |
|---|---|---|---|
| vulnerable | Vulnerable — test succeeded unexpectedly | alert-triangle | The documented negative test exposed the boundary failure |
| remediated | Remediated — documented test blocked | check-circle | The repeated documented test was constrained as expected |
| untested | Untested | minus-circle | No result exists; never imply pass |
| not applicable | Not applicable | slash-circle | Check does not apply to this scenario, with reason |
| running | Running documented test | loader plus text | Execution is active; prior result is not silently replaced |
| unavailable | Evidence unavailable | cloud-off or alert-circle | No current proof; offer recovery or alternate route |
| warning | Review required | alert-circle | Evidence needs qualification and is not a pass/fail result |

“Secure,” “certified,” and unqualified “passed” are prohibited state labels.

## Project-specific evidence components

### Evidence panel

An bordered region containing test name, boundary, state, plain-language consequence, evidence excerpt, test identifier, and limitation. Variants: standard light, dark technical, unavailable, and compact summary.

### Before/after comparison

Desktop: paired columns with synchronized labels and equal hierarchy. Mobile: ordered vertical flow—vulnerable first, remediation second—with a persistent comparison summary. It must never rely on a color-only divider.

### RLS coverage matrix

Rows represent protected resources or operations; columns represent role/tenant checks. Cells use the canonical evidence-state component. Sticky headers are allowed; horizontal scrolling is permitted on small screens only with row identity preserved.

### Code or log excerpt

Dark evidence surface using Geist Mono, line wrapping or controlled horizontal overflow, copy action, contextual caption, redaction indicator, and accessible text. Syntax color is supportive, never the only meaning carrier.

### Finding summary

Contains severity, affected boundary, consequence, reproduction, remediation direction, before/after state, limitation, and report link. Variants: card, report row, and compact scenario summary.

### Scenario card

Contains pillar, risk statement, expected proof, current evidence state, estimated reading/exploration depth rather than an execution-time guarantee, and primary entry action.

### Limitation callout

Always visually adjacent to claims that could be overgeneralized. It uses neutral or informational styling rather than low-contrast legal fine print.

## Feedback and recovery components

- Inline validation for form fields.
- Alert for system-level failure, unsafe live-system request boundary, and unavailable evidence.
- Toast only for transient confirmation that is also represented in page state.
- Skeleton/loading treatment that preserves layout without implying test success.
- Empty state that explains why no evidence exists and what action is available.
- Inquiry acknowledgement panel explicitly separated from engagement acceptance.
- Duplicate-submission notice that preserves the original acknowledgement state.

## Cards and surfaces

Cards use border-first separation, 14 px radius, and restrained shadows. Interactive cards receive visible hover and focus treatment; static report sections do not mimic clickability. Dark technical surfaces are reserved for evidence, logs, policy excerpts, and test detail—not whole-page decoration.

## Component applicability

- Required: buttons, links, form controls, cards, badges/status indicators, alerts, tabs, navigation, stepper, tables/matrix, evidence panel, comparison, finding summary, code/log excerpt, empty/loading/error states.
- Optional: dialog, tooltip, toast, collapsible detail.
- Not applicable in R1: authentication UI, pagination, client-workspace controls, billing, upload controls, scheduling, destructive account actions.

## Approved Gate 3 boundary

This inventory, canonical evidence-state vocabulary, component variants, primary state behavior, before/after comparison model, matrix behavior, evidence panels, report findings, limitation treatment, and R1 applicability decisions are locked. Exact page grids, responsive shell transitions, header behavior, and page hierarchy remain Gate 4 composition decisions.
