# Supabase SaaS Launch-Readiness Lab — Mercurius Design System

Status: Approved  
Version: MDS v1.0  
Product authority: MPS v1.1
Canonical state: `mds/MDS-PROJECT-STATE.yaml`

## 1. Purpose and authority

This MDS defines how buyers experience the Supabase SaaS Launch-Readiness Lab: a public, responsive, evidence-led portfolio product that demonstrates representative authorization, storage/configuration, webhook-integrity, and reliability failures using synthetic data and converts qualified interest into an authorized-review inquiry.

MPS owns purpose, scope, workflows, requirements, rules, acceptance criteria, and release intent. MDS owns visual language, components, layout, interaction, responsive behavior, and design accessibility. MTS must select the implementation architecture, services, security boundaries, tooling, deployment, and agent skills.

Visual authority order:

1. Approved MPS requirement or rule
2. `mds/MDS-PROJECT-STATE.yaml` and this specification
3. `mds/tokens/tokens.json`
4. Approved component and composition specifications
5. Approved canonical references
6. Existing implementation

## 2. Product identity

- Name: **Supabase SaaS Launch-Readiness Lab**
- Mark: boundary frame intersected by a verified check path
- Endorsement: **Built by Josh Coley · Mercurius**, always secondary to the lab identity
- Personality: credible, rigorous, calm, transparent, implementation-aware
- Desired response: confidence, clarity, and controlled urgency
- Visual posture: evidence-led technical studio—polished for buyers and rigorous for engineers

Do not use shields, locks, bugs, hacker silhouettes, fake terminal wallpaper, neon cyber styling, fear-first imagery, glassmorphism, decorative analytics, or generic admin-dashboard chrome.

## 3. Governing principles

1. Evidence is the hero.
2. Make risk legible without oversimplifying it.
3. Trust comes from explicit state and limitation.
4. Keep the buyer path clear beside technical depth.

See `mds/specification/PRINCIPLES.md` for application rules.

## 4. Color system

| Role | Token | Value | Primary use |
|---|---|---:|---|
| Brand ink | `color.brand.ink` | `#0B1220` | Deep framing, strongest emphasis |
| Primary | `color.brand.primary` | `#087A5B` | Primary actions and active paths |
| Primary hover | `color.brand.primaryHover` | `#066449` | Hover and pressed primary actions |
| Accent | `color.brand.accent` | `#19A974` | Small highlights and progress |
| Canvas | `color.surface.canvas` | `#F4F7F9` | Page background |
| Base | `color.surface.base` | `#FFFFFF` | Cards, forms, report surfaces |
| Muted | `color.surface.muted` | `#EEF2F5` | Grouped secondary regions |
| Evidence | `color.surface.evidence` | `#111827` | Code, logs, policies, test evidence |
| Strong text | `color.text.strong` | `#111827` | Headings and primary text |
| Muted text | `color.text.muted` | `#596579` | Supporting text |
| Inverse text | `color.text.inverse` | `#FFFFFF` | Text on ink/evidence surfaces |
| Border | `color.border.default` | `#D6DEE7` | Cards, inputs, tables, dividers |
| Focus | `color.border.focus` | `#2563EB` | Keyboard focus ring |
| Remediated | `color.status.success` | `#087A55` | Documented remediated state |
| Vulnerable | `color.status.danger` | `#B42318` | Demonstrated boundary failure |
| Warning | `color.status.warning` | `#9A5B00` | Qualification or caution |
| Information | `color.status.info` | `#175CD3` | Context and neutral guidance |
| Untested | `color.status.untested` | `#667085` | No test result |

Color never carries status alone. Pair it with an approved icon/shape, label, and explanatory text. Accent green is not approved for body text on white.

## 5. Typography

- Display and UI: Geist Sans
- Evidence/code: Geist Mono

| Role | Desktop size/line | Weight | Mobile override |
|---|---:|---:|---:|
| Display | 56/64 | 650 | 40/46 |
| H1 | 44/52 | 650 | 34/40 |
| H2 | 32/40 | 650 | — |
| H3 | 24/32 | 600 | — |
| H4 | 20/28 | 600 | — |
| Body large | 18/30 | 400 | — |
| Body | 16/26 | 400 | minimum 16 |
| Body small | 14/22 | 400 | — |
| Label | 13/18 | 600 | — |
| Mono | 13/21 | 450 | allow controlled overflow |

Display tracking is `-0.025em`; headings `-0.015em`; labels `0.01em`. Establish credibility through hierarchy and whitespace, not oversized marketing type.

## 6. Spacing, shape, and elevation

- Base unit: 4 px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- Page gutters: 24 mobile, 32 tablet, 48 desktop
- Major section spacing: 56–64 mobile, 80–96 desktop
- Component interiors: normally 12–24
- Radius: 6 compact evidence/status, 10 controls, 14 cards/primary panels, full pill only for compact labels
- Structure: borders and tonal separation first
- Shadows: restrained card shadow; elevated shadow only for menus/dialogs
- Motion: functional 120–200 ms; no essential meaning; respect reduced motion

## 7. Iconography

Use a Lucide-style outline family with consistent 1.75–2 px stroke and 16/20/24 px sizes. Evidence-state icons require adjacent accessible text.

| State | Required symbol |
|---|---|
| Remediated | Check circle |
| Vulnerable | Alert triangle or alert circle |
| Untested | Neutral minus circle |
| Not applicable | Neutral slash/minus circle with reason |
| Running | Loader plus text |
| Evidence unavailable | Cloud-off or alert circle |
| Informational callout | Information circle |

## 8. Core controls

Buttons: primary, secondary, quiet, destructive, inverse; sizes sm/md/lg; states default, hover, focus, active, disabled, loading. Primary uses brand green. Destructive is reserved for a truly destructive or unsafe action, not ordinary vulnerability evidence.

Inputs: persistent visible label; empty, populated, focus, disabled, invalid, and valid where applicable. Required controls include text input, textarea, select, checkbox, and links. No upload, billing, scheduling, authentication, or client-workspace control appears in R1.

Primary touch targets are at least 44 by 44 CSS pixels. Focus must be visible and must not rely on color alone.

## 9. Evidence-state vocabulary

| State | Canonical label | Meaning |
|---|---|---|
| Vulnerable | **Vulnerable — test succeeded unexpectedly** | Documented negative test exposed the representative boundary failure |
| Remediated | **Remediated — documented test blocked** | Repeated documented test was constrained as expected |
| Untested | **Untested** | No result exists; never imply pass |
| Not applicable | **Not applicable** | Check does not apply; include a reason |
| Running | **Running documented test** | Execution active; preserve prior-result clarity |
| Unavailable | **Evidence unavailable** | No current proof; provide recovery or alternate route |
| Warning | **Review required** | Result requires qualification |

Never use “secure,” “certified,” “compliant,” or an unqualified “passed.” Claims such as fixed or launch-ready apply only to the documented synthetic scenario or separately authorized scope.

## 10. Evidence components

- **Evidence panel:** test name, affected boundary, state, plain-language consequence, evidence excerpt, test identifier, and limitation. Variants: light, dark technical, unavailable, compact.
- **Before/after comparison:** paired equal hierarchy on desktop; vulnerable-first vertical sequence plus persistent summary below desktop.
- **RLS coverage matrix:** resource/operation rows and role/tenant check columns; cells use canonical states. Horizontal overflow is allowed only with row identity and labels preserved.
- **Code/log excerpt:** dark surface, Geist Mono, controlled wrapping/overflow, copy action, contextual caption, redaction indicator, accessible text.
- **Finding summary:** severity, affected boundary, consequence, reproduction, remediation direction, before/after state, limitation, report link.
- **Scenario card:** pillar, risk statement, expected proof, evidence state, exploration depth, entry action. Never promise execution time.
- **Limitation callout:** visually adjacent to claims that could be overgeneralized; neutral/informational rather than legal fine print.

## 11. Navigation and interaction

Global header: mark/name left; Scenarios, Sample report, Method, About the service; primary **Discuss an authorized review** action; endorsement secondary.

Scenario navigation identifies all four pillars and current state. Deep views require a breadcrumb/back path. The scenario stepper is exact:

`Context → Vulnerable proof → Remediation → Repeated test → Limitation`

Tabs are keyboard-operable and may not conceal a material warning or limitation. Focus moves only after deliberate navigation, submission, or recovery. Status changes use an accessible live region and preserve a visible explanation.

## 12. Layout and responsive behavior

| Context | Maximum width | Structure |
|---|---:|---|
| Marketing | 1200 | 12 columns / 24 gap desktop |
| Lab/evidence | 1360 | Scenario rail + evidence canvas + optional context |
| Reading/report | 760 | Readable column within report shell |

Breakpoints: mobile 0–639; tablet 640–959; desktop 960–1279; wide 1280+.

- Scenario cards: 4-up wide, 2-up intermediate, 1-up mobile.
- Wide lab: 240–264 scenario rail, flexible evidence canvas, optional 280–320 context panel.
- Tablet: rail becomes in-flow selector; context moves before proof.
- Mobile: scenario selector and step summary, vulnerable proof, remediation, comparison, limitation, retry/report/CTA in reading order.
- Report index becomes in-flow below desktop.
- Inquiry becomes one column with expectations before fields.
- Never hide evidence state, limitations, recovery, report route, or primary CTA for viewport size.
- Test intermediate widths, zoom, long labels, and text expansion—not only named breakpoints.

## 13. Page shells

### Landing

Hero and boundary; four risk pillars; proof method; scenario previews; report preview; service boundary; authorized-review CTA. Dark ink may frame the hero; reading sections remain light-first.

### Scenario index

Synthetic context; optional recommended path; four consistent scenario cards; report reachable without completion; progress says evidence explored, never overall security coverage.

### Guided lab

Scenario identity and state; risk; five-step sequence; evidence/matrix; comparison; consequence/remediation; limitation; next scenario/report/authorized-review routes.

### Sample report

Executive summary and scope; severity counts by documented state; ordered findings; matrix; webhook/recovery evidence; remediation order; method/limitations; case study and CTA. Must remain readable/printable without interaction.

### Inquiry

Expectations and authorization boundary before/beside a concise form. Required states: initial, partial, invalid, submitting, failed/retryable, acknowledged without engagement acceptance, duplicate linked to original acknowledgement, unauthorized live-system request stopped at boundary.

## 14. Accessibility

Target WCAG 2.2 AA. Require semantic landmarks/headings/tables/forms, logical keyboard order, visible focus, accessible tabs, live announcements, text alternatives, 44px touch targets, sufficient contrast, reduced motion, and no image-only evidence. Evidence and controls must remain understandable at zoom and without color.

## 15. Canonical references

| ID | File | Establishes |
|---|---|---|
| MDS-REF-001 | `mds/references/core-design-system-v2.png` | Foundations and core evidence language |
| MDS-REF-002 | `mds/references/landing-desktop-v1.png` | Public narrative and landing hierarchy |
| MDS-REF-003 | `mds/references/component-library-v2.png` | Components, variants, states |
| MDS-REF-004 | `mds/references/layout-behavior-v1.png` | Responsive transformations |
| MDS-REF-005 | `mds/references/scenario-index-desktop-v2.png` | Scenario index composition |
| MDS-REF-006 | `mds/references/guided-rls-desktop-v2.png` | Guided evidence workspace |
| MDS-REF-007 | `mds/references/audit-report-desktop-v1.png` | Buyer-readable report |
| MDS-REF-008 | `mds/references/inquiry-desktop-v1.png` | Inquiry and feedback states |
| MDS-REF-009 | `mds/references/mobile-experience-v4.png` | Mobile composition and reading order |

References are authoritative only for what they clearly show. Illustrative code, dates, counts, rows, and findings are not product data or promises. Written MPS/MDS state and tokens govern exact behavior.

## 16. Governance

Use **REUSE → COMPOSE → EXTEND → CREATE**. A reusable visual decision not defined here is an MDS gap. A specific approved difference is an exception. An unapproved implementation difference is a deviation.

Version changes: patch for clarification without intended behavior change; minor for backward-compatible addition; major for breaking/foundational change. Never silently update canonical behavior.
