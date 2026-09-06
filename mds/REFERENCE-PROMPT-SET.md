# Supabase SaaS Launch-Readiness Lab — Visual Reference Prompt Set

Status: Current generation record  
MDS version: v0.1-draft  
Generation mode: Built-in image generation with approved MDS references supplied as image inputs

## Shared prompt contract

All references were prompted as high-fidelity `ui-mockup` assets and required the approved Core Design System v2 and Landing Page Desktop v1 as visual inputs. Shared invariants: standalone boundary/check-path identity; light-first buyer surfaces; deep-ink framing and evidence panels; green primary action; Geist-style sans and mono; 6/10/14 px radius logic; border-first surfaces; restrained shadows; icon + label + color for status; visible limitations and recovery; no security guarantees, certifications, prices, turnaround claims, hacker clichés, shields, locks, neon, glassmorphism, stock imagery, decorative charts, or watermark.

## Asset prompts

### Component Library v2

Create a landscape implementation-ready component board covering global navigation, button variants and states, controls, evidence statuses, scenario and finding cards, tabs, alerts, the approved five-step scenario stepper, code/log evidence, before/after comparison, RLS matrix, and empty/loading/error/acknowledgement states. Use exact scoped evidence language. The correction prompt aligned the stepper to Context, Vulnerable proof, Remediation, Repeated test, and Limitation; removed generic scan language and finding counts.

### Layout and Responsive Behavior v1

Create one responsive specification board for Desktop 1440, Tablet 768, and Mobile 390. Demonstrate the guided-lab rail transforming into an in-flow selector, context relocation, evidence-preserving mobile order, landing-card 4/2/1 transformation, and labeled matrix overflow while retaining row identity and primary actions.

### Scenario Index Desktop v2

Create a shippable public scenario index with synthetic SaaS context, optional recommended path, four consistent scenario cards, documented negative-test descriptions, neutral untested states, evidence-explored language that does not imply security coverage, direct sample-report access, service boundary, and authorized-review CTA. The correction prompt changed the first card's red state to neutral untested.

### Guided Authorization and RLS Desktop v2

Create the wide guided-lab shell with scenario rail, evidence canvas, context panel, approved five-step hierarchy, plain-language risk, vulnerable and remediated proof, code/log panels, matrix, limitation, retry, sample report, and authorized-review route. The correction prompt replaced red X not-applicable symbols with neutral minus symbols.

### Sample Audit Report Desktop v1

Create a buyer-readable sample report with explicit synthetic scope, severity summary, findings by pillar, RLS matrix, one expanded finding containing consequence, documented negative test, evidence, remediation, repeated-test result, and persistent limitation, plus methodology, limitations, and restrained CTA. All data is illustrative.

### Inquiry Desktop v1

Create a two-column authorized-review inquiry page explaining next steps and scope beside a high-level form. Do not request credentials, secrets, production data, or uploads. Include persistent labels, review-pillar selection, acknowledgement, retryable failure, lab/report routes, and discreet endorsement. Do not promise response time, price, or outcome.

### Mobile Experience v4

Rebuild four 390px mobile references—landing, scenario index, guided RLS lab, and inquiry—from the approved core, responsive, and earlier composition references. Require accessible navigation, 24px gutters, 44px touch targets, visible evidence state, limitation, recovery, report route, and CTA. Use the exact synthetic-scenario heading and five-step lab sequence. Require a clearly recognizable information-circle icon—or no icon—in the Privacy and scope callout and prohibit all lock, shield, keyhole, key, and security imagery. Version 4 satisfied these constraints and replaced rejected version 3.
