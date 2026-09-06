# Supabase SaaS Launch-Readiness Lab — Foundation Proposal

Status: Approved — Gate 2 complete  
MDS version: v0.1-draft  
Depends on: MDS-DEC-004–006

## Recommended identity

- Primary name: **Supabase SaaS Launch-Readiness Lab**
- Compact product mark: a boundary frame intersected by a single verified check path, representing isolation plus proof—not a shield, lock, bug, or hacker symbol.
- Endorsement: **Built by Josh Coley · Mercurius** in secondary navigation/footer placement.
- Tone: precise, calm, direct, technically literate, and commercially understandable.

## Recommended color system

Use a light-first buyer experience with deep-ink framing and dark evidence/code panels. This keeps the site credible and readable while preserving a strong technical character.

| Role | Token | Value | Use |
|---|---|---:|---|
| Brand ink | `brand.ink` | `#0B1220` | Hero, navigation, strongest headings, dark evidence surfaces |
| Brand primary | `brand.primary` | `#087A5B` | Primary actions, active paths, verified emphasis |
| Brand primary hover | `brand.primaryHover` | `#066449` | Hover/pressed primary controls |
| Brand accent | `brand.accent` | `#19A974` | Small highlights and progress—not body text on white |
| Canvas | `surface.canvas` | `#F4F7F9` | Page background |
| Surface | `surface.base` | `#FFFFFF` | Cards, report sections, forms |
| Surface muted | `surface.muted` | `#EEF2F5` | Grouped evidence and secondary regions |
| Evidence dark | `surface.evidence` | `#111827` | Logs, policy excerpts, test evidence |
| Text strong | `text.strong` | `#111827` | Primary body and headings |
| Text muted | `text.muted` | `#596579` | Supporting text |
| Border | `border.default` | `#D6DEE7` | Cards, inputs, tables, dividers |
| Focus | `focus.ring` | `#2563EB` | Keyboard focus ring |
| Success/remediated | `status.success` | `#087A55` | Verified remediated state |
| Failure/vulnerable | `status.danger` | `#B42318` | Demonstrated vulnerable state |
| Warning | `status.warning` | `#9A5B00` | Qualification or caution |
| Information | `status.info` | `#175CD3` | Context and neutral guidance |
| Untested | `status.untested` | `#667085` | Explicitly untested evidence |

Status communication always combines color with an icon/shape, a label, and explanatory text. “Passing” is written as **Remediated — documented test blocked**, never as an unqualified “secure.”

The proposed primary, muted text, semantic status, and inverse text pairings were contrast-checked against their intended white or ink backgrounds and each clears the WCAG AA 4.5:1 text threshold.

## Recommended typography

- Display and interface: **Geist Sans**
- Evidence, code, policies, and event IDs: **Geist Mono**
- Display headings remain restrained; credibility comes from hierarchy and whitespace rather than oversized marketing type.

| Role | Size / line-height | Weight |
|---|---:|---:|
| Display | 56 / 64 | 650 |
| H1 | 44 / 52 | 650 |
| H2 | 32 / 40 | 650 |
| H3 | 24 / 32 | 600 |
| H4 | 20 / 28 | 600 |
| Body large | 18 / 30 | 400 |
| Body | 16 / 26 | 400 |
| Body small | 14 / 22 | 400 |
| Label | 13 / 18 | 600 |
| Mono | 13 / 21 | 450 |

Mobile display reduces to 40 / 46 and H1 to 34 / 40; body text remains 16 px.

## Recommended spacing and density

- Base unit: 4 px.
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- Component interiors: normally 12–24 px.
- Page gutters: 24 px mobile, 32 px tablet, 48 px desktop.
- Major narrative sections: 80–96 px desktop, 56–64 px mobile.
- Evidence tables and log panels may be denser, but primary labels and actions must remain scannable.

## Recommended shape and elevation

- Small radius: 6 px for compact statuses and evidence cells.
- Control radius: 10 px for inputs and buttons.
- Card radius: 14 px for primary content surfaces.
- Pill radius: fully rounded only for compact labels—not primary buttons.
- Borders do most structural work; shadows are restrained.
- Default card shadow: subtle, low spread; elevated shadows reserved for menus and dialogs.
- Evidence surfaces use borders and tonal separation instead of glow effects.

## Recommended iconography

- Lucide-style outline icons with a consistent 1.75–2 px stroke.
- Standard sizes: 16, 20, and 24 px.
- Required state shapes: check-circle for documented remediated proof, alert-triangle for vulnerable evidence, minus-circle for untested, slash-circle for not applicable, loader for running, and cloud-off or alert-circle for unavailable.
- Do not use icons without adjacent accessible labels for material evidence state.

## Recommended motion

- Functional, short, and restrained: 120–200 ms for control and panel transitions.
- Test execution can show progress, but motion must never manufacture credibility or conceal immediate state.
- Respect reduced motion; evidence remains complete without animation.

## Approved foundation boundary

The product-mark concept, light-first/dark-evidence composition, palette roles and values, Geist typography, 4 px spacing base, restrained shape/elevation system, outline icon style, functional motion, and WCAG 2.2 AA posture are locked. Component specifications and page composition remain later MDS gates.
