# Supabase SaaS Launch-Readiness Lab — MDS QA Compliance Report (R1)

Protocol: `mds/qa/MDS-QA.md`
Status: **REVIEW REQUIRED** — Gate 1 and Gate 3 executed and passed; Gate 2 rendered and compared, awaiting owner sign-off
Reviewer: Claude (agent execution) — Gate 2 visual judgement reserved to Josh Coley
Date: 2026-09-10

> This report records what was executed and measured. No gate result in it is
> claimed from an unrun check, and no fidelity claim is made beyond the rendered
> comparison that was actually performed.

## 1. Subject and environment

| Field | Value |
|---|---|
| Project | Supabase SaaS Launch-Readiness Lab (`POB-2026-36-02`) |
| Release | R1 |
| Slice | S6 — measurement boundary, combined QA, release |
| MPS version | v1.1 |
| MDS version | v1.0 |
| MTS version | v0.6-draft (Gate 6 approved; Gate 7 in progress) |
| Branch / commit | `slice/s6-measurement-and-release` @ `55b9357` (plus this slice's QA additions) |
| Build under test | `pnpm build && pnpm start` — production build, served fresh per run |
| Host | Ubuntu 26.04 LTS, Node v24.17.0, Next.js 16.3.4 |
| Browser harness | Playwright 1.63.0 |
| Browser coverage | Chromium (mobile 390, tablet 768, desktop 1200, wide 1440) and Firefox (desktop), locally. WebKit runs in CI only (MTS-EXC-002) and **has not yet seen the two new suites** — they will meet it on this branch's pull request. |
| Data | Synthetic fixture only. No hosted database, no inquiry row, and no real notification was written by any check in this report. |

### Routes and states covered

Ten public routes: `/`, `/scenarios`, the four `/scenarios/[slug]` labs, `/method`,
`/about`, `/report`, `/inquiry`.

States exercised: untested, running, vulnerable, remediated, not applicable,
unavailable, warning/review-required, empty, default, hover, focus, active,
selected, disabled, loading, invalid, submitting, failed/retryable, acknowledged,
duplicate, authorization-boundary, and print.

## 2. What was executed

| Suite | File | Purpose | Result |
|---|---|---|---|
| Gate 1 foundation | `e2e/qa-gate1.spec.ts` | Token layer, type scale, colour/radius/shadow census, font loading and shift attribution, evidence-state carriers, inquiry-surface boundary | **PASS** |
| Gate 3 product quality | `e2e/qa-gate3.spec.ts` | Six required widths plus intermediates, gutters, reflow, zoom, text spacing, long content, composition transforms, touch targets, reduced motion, print | **PASS** |
| Gate 2 render capture | `qa/capture.spec.ts` (`pnpm qa:capture`) | Rendered evidence for each canonical reference, at its intended viewport and state | Renders produced; comparison below |
| Slice behaviour | `e2e/s1`–`s6` | The behaviour each slice introduced, already traced to MPS acceptance | **PASS** (numbers below) |
| Engineering gate | `pnpm check` | format, lint, types, evidence freshness, unit tests, build | **PASS** (numbers below) |

Gate 1 and Gate 3 are new. They exist because the slice suites prove the
behaviour each slice introduced, and the protocol asks a different question: does
the *combined* product still stand on the approved foundation, at every width,
in every state. Both are ordinary members of `pnpm test:e2e` and run in every
browser project, so a regression fails the release gate rather than waiting for
the next manual pass.

### Recorded results

| Run | Command | Result |
|---|---|---|
| Full browser suite | `pnpm test:e2e --workers=1` | **904 passed, 0 failed, 1 skipped**, 18.5 min, exit 0, across five projects (chromium mobile/tablet/desktop/wide, firefox desktop) |
| Engineering gate | `pnpm check` from a deleted `.next` | **151 unit tests passed, 1 skipped**, exit 0 |

The skipped unit test is `inquiry-live-delivery.spec.ts`, which sends a real
message and runs only under `INQUIRY_LIVE_DELIVERY=1`. It is recorded as skipped,
not as passing.

Two earlier full-suite runs during this pass are recorded rather than discarded,
because what they found is the substance of this report:

- **902 passed, 2 failed** — both failures were defects in the two new suites
  themselves: one-shot `innerText` reads racing the render. Fixed by using
  retrying assertions. A third, a radius census reading an element before it had
  laid out, was fixed the same way.
- **903 passed, 1 failed** — the failure was MDS-QA-R1-F010, a real
  accessibility defect in the product, found because the suite ran at one worker
  where the previous record said it never failed.

The capture run is deliberately **not** a gate. It is configured separately
(`playwright.capture.config.ts`) because a capture run that "passes" proves only
that files were written, and Gate 2 is a judgement, not an assertion.

## 3. Gate 1 — foundation compliance: **PASS**

| Requirement | How it was verified | Result |
|---|---|---|
| Semantic token use; no unauthorised hardcoded design values | Every approved colour, radius, and motion token read from `mds/tokens/tokens.json` and compared against the resolved runtime custom property. Static sweep of `app/` and `components/` for hex literals and arbitrary Tailwind values. | Pass |
| No unapproved colour renders | Every element on all ten routes: `color`, `background-color`, drawn `border-color`, and drawn `outline-color` compared against the approved palette. Alpha tints are checked on their uncomposited base, so approved opacity variants pass and an unapproved hue cannot. | Pass — **zero** unapproved colours across ten routes |
| Geist Sans / Mono loading, roles, weights, scale | `document.fonts` inspected for the loaded family; computed families checked on body, headings, and evidence; the full type scale compared against DESIGN-SYSTEM §5 in px. | Pass |
| Layout-shift behaviour | Layout shifts observed from document start and attributed by source element. | Pass with finding — see MDS-QA-R1-F002 |
| Approved colours, semantic state mapping, contrast | Contrast measured from computed styles on every leaf text node against its first opaque ancestor background, in the run state as well as at rest (`e2e/contrast.ts`, exercised by the S1/S2/S5 suites). | Pass |
| 4px spacing system, page gutters, section rhythm | Gutters measured on the shared `Container` at eight breakpoint boundaries (Gate 3). Spacing scale is expressed through Tailwind's 4px base; no arbitrary spacing value is used outside the approved container maxima (1200 / 1360 / 760, DESIGN-SYSTEM §12). | Pass |
| 6/10/14/pill radius; border-first surfaces; restrained shadows | Radius census over every element on all ten routes against the approved scale, with the pill clamp handled explicitly. Every rendered `box-shadow` matched against the two approved elevations. | Pass with finding — see MDS-QA-R1-F001 |
| Product mark, secondary endorsement, Lucide-style icons | `components/brand/product-mark.tsx` is the boundary frame intersected by a check path; `Built by Josh Coley · Mercurius` renders secondary in the footer; icons are an inlined Lucide-geometry outline set at stroke 2 (`components/ui/icon.tsx`). | Pass |
| No shields, locks, bugs, hacker/neon/glass/decorative-dashboard treatment | Source sweep for the prohibited motifs and for `backdrop-blur`, gradients, and non-approved shadow utilities. | Pass — zero occurrences |
| Buttons/inputs/links and required variants and states | `components/ui/button.tsx`, `field.tsx`, and the S1/S5 suites exercise the variants and states. | Pass |
| Exact evidence vocabulary; icon + label + explanation + colour | `components/ui/status-indicator.tsx` is the single source of all seven canonical labels; every evidence state in the product renders through it. Verified in forced-colours emulation that the labels survive as text, and that no state mark renders without accompanying text. | Pass |
| Shared-component reuse; REUSE → COMPOSE → EXTEND → CREATE | Import census across `app/` and `components/`. | Pass with observation — see MDS-QA-R1-F009 |
| Prohibited claims | "secure", "certified", "compliant", "guaranteed", unqualified "passed" — source sweep and rendered-text assertion on every route (S1). | Pass — zero occurrences |
| Inquiry-surface safety | No `file` or `password` control; no field name or autocomplete token matching a credential or payment pattern; every control carries a visible `<label for>`. | Pass |

**Gate 1 fails for** a material unapproved token system, inaccessible status
meaning, prohibited claims, unsafe inquiry fields, or systemic one-off component
duplication. None is present.

## 4. Gate 2 — visual fidelity: **REVIEW REQUIRED (owner sign-off)**

### Method

Rendered output was captured from the production build at the intended viewport
for each reference and state, using `pnpm qa:capture`. 86 renders were written to
`mds/qa/renders/`, named `<reference>-<subject>-<state>-<width>.png`.

Each render was then compared against its canonical reference on **page
structure, maximum widths, grid and gutters, alignment, section spacing,
hierarchy, whitespace and density, typography relationships, surfaces, component
proportions, semantic emphasis, visual rhythm, CTA/evidence balance, and
Do/Don't compliance** — the system and composition, not the illustrative sample
text, counts, dates, or findings inside the images.

**No pixel diff was performed and none is claimed.** The references are generated
design boards, not renders of this implementation; a pixel comparison between
them would measure the difference between a board and a product, not fidelity.
The comparison performed was a structural and compositional review of real
rendered output, which is what Gate 2 asks for.

### What this pass builds on

This is not the first rendered comparison. Earlier in S6, a rendered comparison
of every main route against the canonical references found five divergences,
which were fixed in commit `c82c136` ("close the MDS Gate 2 fidelity findings"):
the missing inquiry breadcrumb (DESIGN-SYSTEM §11), the inquiry page's missing
back and sample-report routes, the inquiry left column's whitespace imbalance,
the pillar cards' missing entry affordance (MDS-REF-002), and a field-pair
baseline misalignment. That work was never written up as a QA record, so it did
not produce a protocol result. This pass re-ran the comparison against the
current build and confirms all five as closed; the findings below are new and
distinct from them.

Two artefacts of the capture method, so they are not read as product defects:

- In full-page captures the sticky header is painted once, mid-page, where the
  scroll position was when the shutter opened. It is a Playwright full-page
  artefact; the viewport captures (`ref-004-*`) show the real behaviour.
- The report is over 43,000 px tall at 1440, so it is captured as the fold plus
  one render per approved section rather than as one image.

### Reference-by-reference

| Reference | Route / state | Renders | Structural result | Findings |
|---|---|---|---|---|
| MDS-REF-001 | Foundations and state language, via `/report` | `ref-001-state-language-1440` | Palette, type relationships, spacing, radius, and the seven-state language all match the written MDS and the board | none |
| MDS-REF-002 | `/` at 1440, 1200, 768, 390 | `ref-002-*` (8) | Ink hero with evidence snapshot and code excerpt, four pillars, proof sequence, scenario previews, report preview, service boundary, CTA band, footer — all present and in the reference's order | F004, F008; stepper vocabulary is MTS-OBS-001 |
| MDS-REF-003 | Shared components across `/report` and the lab | `ref-003-*` (7) | Matrix, finding summary, before/after, code excerpt, stepper, and state marks match the approved component specs, including the reconciled neutral-minus not-applicable treatment | F009 (observation) |
| MDS-REF-004 | `/`, `/scenarios`, lab, `/report`, `/inquiry` at 390/640/768/960/1280/1440 | `ref-004-*` (30) | 4/2/1 card transformation, rail-to-selector change, in-flow report index, one-column inquiry — all as specified | none |
| MDS-REF-005 | `/scenarios` at 1440, 1200, 768, 390 | `ref-005-*` (4) | Synthetic context panel, optional recommended path, four consistent cards in the canonical untested state, report route reachable without completion | F004 |
| MDS-REF-006 | Lab at 1440 and 390, untested / vulnerable / remediated | `ref-006-*` (8) | Three-region composition (rail 245px within the approved 240–264, evidence canvas, 300px context panel within the approved 280–320), approved five-step stepper, evidence hierarchy, limitation and recovery present | F006, F007 |
| MDS-REF-007 | `/report` at 1440 and 390, plus print | `ref-007-*` (13) | Ink header band, sticky section index beside the body, the eight approved sections in order, severity by documented state, findings ordered by launch risk, matrix, limitations, case study, CTA; prints complete with no dark surface | F005 |
| MDS-REF-008 | `/inquiry` at 1440 and 390 — initial, invalid, acknowledged, duplicate, failed, authorization-boundary | `ref-008-*` (12) | Expectations and authorization boundary before/beside the form, persistent visible labels, no upload or credential field, acknowledgement that promises nothing, duplicate linked to the original, retryable failure | none |
| MDS-REF-009 | Mobile order and action retention at 390 | `ref-009-*` (3) plus the 390 renders under REF-002/005/006/007/008 | Selector, step summary, proof, remediation, comparison, limitation, then recovery/report/CTA; every primary action retained | F006 |

### Gate 2 findings for owner ruling

| ID | Severity | Class | Finding |
|---|---|---|---|
| MDS-QA-R1-F004 | minor | GAP | MDS-REF-002 and MDS-REF-005 render the four pillar icons in four different hues — green, green, **purple**, **orange**. Neither purple nor orange exists in the approved palette (`mds/tokens/tokens.json`, DESIGN-SYSTEM §4). The implementation renders all four in `color.brand.primary` (`components/scenarios/scenario-card.tsx`, `risk-pillars.tsx`), which is why the Gate 1 colour census is clean. Written tokens outrank a canonical reference (authority order items 3 and 5), so this is recorded as an **MDS gap**: the references show a per-pillar hue the token system does not define. Ruling needed: keep the single approved hue, or approve pillar-hue tokens. |
| MDS-QA-R1-F005 | minor | EXCEPTION (proposed) | MDS-REF-007 shows the report as **three** columns — index, body, and a right sidebar carrying Methodology, Scope & limitations, and the CTA. `mds/COMPOSITION-PROPOSAL.md` "Audit report shell" specifies **two**: "Desktop uses a sticky section index beside the report", with method and limitations as section 7 and the CTA as section 8. The implementation follows the written composition. Written MDS outranks the reference; recorded so the difference is approved rather than silent. |
| MDS-QA-R1-F006 | minor | GAP | On mobile the scenario **context panel** sits between the scenario selector and the step summary. The written mobile order (DESIGN-SYSTEM §12, AGENTS.md) lists "scenario selector and step summary, vulnerable proof, remediation, comparison, limitation, retry/report/CTA" and does not mention the context panel; MDS-REF-009 panel 3 does not show one. The tablet rule — "context moves before proof" — is satisfied, and Gate 3 confirms selector → steps → proof → remediation → CTA. Ruling needed: confirm the context panel's mobile position, or specify it. |
| MDS-QA-R1-F007 | minor | observation | MDS-REF-006 shows **one** before/after pair on the lab canvas. The implementation renders **eleven**, one per documented test, so the remediated lab is 13,564 px tall at 1440. Every pair is real evidence the fixture produced, and suppressing any of it would be the worse error, but the reference's single-screen density is not preserved. Ruling needed on whether the canvas should group, paginate, or collapse repeated pairs — which would be an MDS change, not an implementation choice. |
| MDS-QA-R1-F008 | observation | observation | At 1440 the landing display type wraps to three lines ("Supabase SaaS / Launch-Readiness / Lab") where MDS-REF-002 shows two. The type scale is correct (display 56/64, DESIGN-SYSTEM §5); the hero's left column is narrower than the board's because the evidence snapshot beside it is wider. Composition and hierarchy are preserved. |

None of these is a critical or major deviation. Gate 2 cannot be marked PASS by
the agent regardless: the protocol assigns that judgement to the owner.

## 5. Gate 3 — product quality: **PASS**

### Responsive and content stress

| Check | Method | Result |
|---|---|---|
| Six required widths plus intermediates | 390, 640, 768, 960, 1280, 1440 and 414, 700, 860, 1024, 1150, 1366 — every width against all ten routes, no horizontal page overflow | Pass (160 width/route combinations) |
| Page gutters | Measured on the shared `Container` at 390, 639, 640, 768, 959, 960, 1280, 1440 | Pass — exactly 24 / 32 / 48 |
| 4/2/1 scenario-card transformation | Column count measured from shared row tops, polled to the settle | Pass (S1) |
| Rail → in-flow selector below 960 | Rail hidden, disclosure selector present and operable | Pass (S2, Gate 3) |
| Context relocation, vulnerable-first mobile order | Rendered vertical positions at 390: selector → step summary → documented test → remediation → CTA | Pass (see F006 for the context panel's position) |
| Report and inquiry sidebars in-flow below desktop | Report index beside the body at 1440, above it at 768, never hidden; inquiry one column with expectations before fields at 390 | Pass |
| Matrix row identity during horizontal overflow | Region scrolled to its far edge; row header remains `position: sticky`, on screen, and still labelled | Pass |
| Reflow at 320 CSS px (WCAG 1.4.10) | 320 × 256, all ten routes, no two-dimensional scrolling, CTA retained | Pass |
| Browser zoom 200% and 400% | Emulated as a browser implements it — CSS viewport divided and device pixel ratio multiplied (640 × 450 @ dpr 2; 320 × 225 @ dpr 4) | Pass |
| Text spacing (WCAG 1.4.12) | Line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, paragraph spacing 2em injected at 390, 768, 1280 on all ten routes; no page overflow and no clipped text | Pass |
| Long content | Long labels in headings, cells, and list items; a 240-character unbroken token in an evidence line. The evidence region scrolls itself; the page body never does | Pass (see F003) |
| 44 × 44 touch targets | Primary controls on every route at 390 and 640 | Pass |
| Evidence state, limitation, report route, CTA never hidden for viewport | Asserted at all six required widths on a scenario route, which carries all four at once | Pass |

### Interaction states

Exercised across the slice suites and this one: default, hover, focus, active,
selected, disabled, loading, running, vulnerable, remediated, untested, not
applicable, warning, unavailable, empty, invalid, submitting, failure, retry,
acknowledgement, duplicate, and the blocked unauthorized-request boundary.

Two protocol-specific properties were re-verified here:

- **Old or unavailable evidence never becomes an implied pass.** The unavailable
  state renders "Evidence unavailable. No documented sequence result is shown, and
  nothing should be read as a pass." Reset returns the lab to untested rather than
  to a stale result (S2).
- **Focus moves only after deliberate navigation, submission, or recovery.** A
  status change is announced without moving focus (S2); focus moves to the
  acknowledgement after a submission (S5).

  This pass found that second half **broken** — intermittently, focus did not
  move at all. It is fixed, and the fix is verified. See MDS-QA-R1-F010; it is
  the one substantive defect this QA pass surfaced.

### Accessibility

| Requirement | Result |
|---|---|
| Complete keyboard path through navigation, scenarios, tabs, evidence, report, inquiry | Pass (S1, S2, S5) |
| Focus moves to the acknowledgement after submission | Pass **after a fix made in this pass** — see MDS-QA-R1-F010 |
| Visible focus, logical reading and tab order | Pass — 2px focus ring plus offset, so focus never depends on colour alone |
| Semantic landmarks, headings, lists, tables, forms, labels, descriptions, errors | Pass — banner/main/contentinfo and exactly one `h1` on every route; `th[scope]` row headers; errors tied by `aria-describedby` |
| Accessible tabs and inactive-panel handling | Pass (S2) |
| Live announcements for running/completed/failed and inquiry states | Pass (S2, S5) |
| Status meaning without colour or imagery | Pass — verified under forced-colours emulation |
| AA contrast for text, controls, focus, meaningful indicators | Pass — measured from computed styles, at rest and in the run state |
| Reduced motion | Pass — no transition or animation over 1ms survives `prefers-reduced-motion: reduce`, and the evidence state is still stated as text |
| Text alternatives; readable technical evidence | Pass |
| Zoom and reflow without clipped content or lost action | Pass |

### Runtime integrity

Console errors, uncaught script errors, failed requests, and 4xx/5xx responses
are asserted empty on every public route (S1). Font, asset, and hydration health
verified. Layout shift measured and attributed — MDS-QA-R1-F002.

## 6. Screen acceptance matrix

| Experience | Product trace | Required MDS evidence | Result |
|---|---|---|---|
| Landing | ACC-001, 010 | Purpose/boundary, four pillars, proof path, report and CTA, responsive hierarchy | Pass |
| Scenario context/index | ACC-002 | Synthetic context, optional recommended path, distinct untested state, report route | Pass |
| Authorization/RLS | ACC-003–005 | Affected boundary, negative evidence, exact remediated state, matrix classifications, limitation | Pass |
| Storage/configuration | ACC-006 | Secret-safe proof, tested/not-tested distinction, remediation and limitation | Pass |
| Webhook integrity | ACC-007 | Replay/duplicate evidence, idempotent result, before/after, limitation | Pass |
| Reliability/recovery | ACC-008, 014 | Failure/retry/recovered/unavailable states, preserved context, return route | Pass |
| Findings/report | ACC-009, 010 | Severity, reproduction, impact, remediation, comparison, limitation, print/readability | Pass |
| Inquiry | ACC-011–013 | High-level fields, no secrets/uploads, failure vs acknowledgement, duplicate integrity, authorization stop | Pass |
| Cross-cutting safety | ACC-015 | No production credential, real customer record, raw secret, or upload required/exposed | Pass |

## 7. Referenced evidence

**MPS acceptance** — MPS-ACC-001 through 016 are covered by the slice suites and
unit tests, and recorded in `mps/qa/MPS-QA-REPORT-R1.md`.

**MTS verification** — commands, environments, and results are recorded in
`mts/qa/MTS-QA-REPORT-R1.md`.

## 8. Findings

| ID | Gate | Severity | Class | Status |
|---|---|---|---|---|
| MDS-QA-R1-F001 | 1 | minor | DEVIATION | Open — owner ruling |
| MDS-QA-R1-F002 | 1 | observation | observation | Open — owner ruling |
| MDS-QA-R1-F003 | 3 | observation | observation | Open — no action proposed |
| MDS-QA-R1-F004 | 2 | minor | GAP | Open — owner ruling |
| MDS-QA-R1-F005 | 2 | minor | EXCEPTION (proposed) | Open — owner approval |
| MDS-QA-R1-F006 | 2 | minor | GAP | Open — owner ruling |
| MDS-QA-R1-F007 | 2 | minor | observation | Open — owner ruling |
| MDS-QA-R1-F008 | 2 | observation | observation | Open — no action proposed |
| MDS-QA-R1-F009 | 1 | observation | observation | Open — no action proposed |
| MDS-QA-R1-F010 | 3 | **major** | DEVIATION | **Closed in this pass** — found, cause identified, fixed, verified |

Counts, still open: **0 critical, 0 major, 5 minor, 4 observations.** One major
deviation (MDS-QA-R1-F010) was found and closed inside this pass. No prohibited claim, no
safety-boundary violation, no untested required viewport or state, and no
unavailable design-delivery capability.

### MDS-QA-R1-F001 — an unapproved 4px radius on the consent checkbox

DESIGN-SYSTEM §6 approves radii of 6 (compact evidence/status), 10 (controls), 14
(cards/panels), and the full pill. The inquiry consent checkbox draws at 4px
(`components/ui/field.tsx`, `rounded-[4px]`). It is the only rendered radius on
any of the ten routes that is not on the approved scale.

Deliberately not changed: 4 → 6 is a two-pixel visual change to an approved
control, and the approved authority order puts that decision with the owner. The
Gate 1 assertion names it as `RADIUS_FINDING_MDS_QA_R1_F001`, so the exception is
visible in the assertion itself; deleting that constant is the fix once ruled on.

### MDS-QA-R1-F002 — a 0.121 layout shift from the shell footer

Every public route records exactly one layout shift, value **0.121**, sourced to
a single element: the shell footer. The shell is a sticky footer (`body` is
`flex min-h-full flex-col`, `main` is `flex-1`), so while the document is still
parsing, the footer sits at the viewport bottom and moves down as `main` fills.

Whether it lands before or after first contentful paint varies between runs by
a few tens of milliseconds — measured at 688ms against an FCP of 856ms in one
run, and after FCP in another — so it **cannot** be claimed to be invisible. It
is not a font swap, a hydration reflow, or a late injection: the Gate 1 assertion
requires that no element *other than* the footer ever moves, and that passes.

0.121 is just above the 0.1 documented good-experience threshold. Ruling needed
on whether to accept it as a property of progressive rendering with a sticky
footer, or to treat it as an MDS/MTS item.

### MDS-QA-R1-F003 — a word wider than the viewport cannot wrap

At mobile H1 size a single 29-character token measures ~516px against 342px of
available width, and no layout can wrap it. Headings do not set an
`overflow-wrap` fallback. Every heading in the product is approved content from
`lib/content/`, where no such word exists, so this is latent rather than live.
Recorded so a future content change is known to carry the risk.

### MDS-QA-R1-F010 — focus did not reach the acknowledgement (found and fixed)

The approved interaction rule (DESIGN-SYSTEM §11) is that focus moves after a
deliberate submission. It intermittently did not.

`components/inquiry/inquiry-form.tsx` moved focus inside a
`requestAnimationFrame` callback, which can run *before* React commits the
outcome. The live region carries `empty:hidden`, so while it still has no
children it is `display: none` — and `focus()` on a hidden element is a silent
no-op that never retries. Focus stayed where the submit button had been, and a
keyboard or screen-reader buyer was never taken to the acknowledgement that
tells them what happened.

It had been recorded as a flaky test (MTS-OBS-053) after two failures under a
loaded two-worker run that would not reproduce quietly. That was wrong. It
recurred in this pass in a full suite at **one worker**, with the status region
resolving fourteen times over five seconds and never taking focus — fourteen
retries is not a timing race, it is focus that never moved.

**Fixed.** The move is requested at submission and performed in an effect keyed
on the outcome, so it runs after the commit, when the region has its children.
No approved behaviour changed; this is what the approved behaviour always said
should happen. Verified with `e2e/s5-inquiry.spec.ts` on chromium-mobile at one
worker, `--repeat-each=6`: 138/138, including the assertion that an outcome is
announced *without* stealing focus mid-typing.

The failing assertion was correct the whole time. It is recorded here because a
QA pass that dismissed it a second time would have shipped the defect.

### MDS-QA-R1-F009 — the card surface recipe is expressed in ten places

`rounded-card border-line` is applied directly in nine components in addition to
`components/ui/card.tsx`. These are the distinct evidence primitives the approved
COMPONENTS-PROPOSAL names in their own right — matrix, before/after, code
excerpt, delivery ledger, severity overview, sequence summary, scenario
navigation, replay comparison, report preview — not copies of one another, so
this is not the systemic one-off duplication Gate 1 fails for. It is recorded
because a future change to the approved card surface must be made in ten places
rather than one.

Three raw `<button>` elements exist outside `components/ui/`: the code excerpt's
tab and copy controls, and the header menu toggle. All three are pattern controls
(tabs, a disclosure) rather than instances of the approved Button, which is the
correct composition.

## 9. Open items, exceptions, and blockers

**Open MDS gaps:** MDS-QA-R1-F004 (pillar icon hue), MDS-QA-R1-F006 (mobile
context-panel position).

**Approved MDS exceptions:** none carried in. MDS-QA-R1-F005 is proposed for
approval.

**Open deviations:** MDS-QA-R1-F001 (minor, non-blocking). MDS-QA-R1-F010 was a
major deviation and is closed.

**Blockers to an MDS PASS:** none of the release-rule conditions is met — there
is no open critical or major deviation, no untested required viewport or state,
no unavailable design-delivery capability without an approved fallback, and no
prohibited claim or safety-boundary violation. The single remaining condition is
that Gate 2 is a judgement the owner has not yet made.

**Carried from MTS, not raised here:** MTS-DEV-003 (preview and production share
one Supabase project) blocks calling the preview environment compliant with the
approved environment boundaries. It does not affect any result in this report:
every check ran against a local production build with no hosted database.

## 10. Recommended MDS updates

1. Rule on MDS-QA-R1-F004 and record the outcome in `mds/REFERENCE-RECONCILIATION.md`
   — either that the single approved hue is correct and the boards' per-pillar
   hues are illustrative, or that pillar-hue tokens are to be added.
2. Approve MDS-QA-R1-F005 as a recorded exception so the two-column report shell
   is documented rather than merely correct.
3. Rule on MDS-QA-R1-F006 and, if the context panel's mobile position is
   confirmed, add it to the DESIGN-SYSTEM §12 mobile order so the written rule is
   complete.
4. Rule on MDS-QA-R1-F001 and MDS-QA-R1-F007.

## 11. Overall result

**REVIEW REQUIRED.**

Gate 1: **PASS**. Gate 3: **PASS**. Gate 2: rendered, compared, and reported —
**owner sign-off outstanding**, which the protocol reserves to the owner and
which no agent result can supply.

On owner approval of the Gate 2 comparison and a ruling on the five minor
findings, this report supports **PASS WITH APPROVED EXCEPTIONS**. It does not
support an unqualified PASS while any of them is open.

Reviewer: Claude (agent execution), 2026-09-10.
Gate 2 sign-off: _________________________ Josh Coley, date ____________
