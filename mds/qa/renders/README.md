# Gate 2 renders

Rendered evidence for MDS QA Gate 2 (`mds/qa/MDS-QA.md`), produced by
`pnpm qa:capture` from a production build. The comparison against the canonical
references in `mds/references/` is written up in `mds/qa/MDS-QA-REPORT-R1.md`.

These are **renders of this product**, not design references. Nothing here is
canonical: the authority is the written MDS, the token file, and the nine
approved reference images.

## Naming

`<reference>-<subject>-<state>-<width>.png`

So `ref-008-inquiry-duplicate-390.png` is the inquiry route in its duplicate
state at 390 CSS px, captured for MDS-REF-008.

## Reading them

Two artefacts of the capture method, so neither is read as a product defect:

- In **full-page** captures the sticky header is painted once, mid-page, where
  the scroll position was when the shutter opened. The `ref-004-*` captures are
  viewport-sized and show the real behaviour.
- The report is over 43,000 px tall at 1440, so it is captured as the fold
  (`ref-007-report-fold-*`) plus one render per approved section
  (`ref-007-section-*`) rather than as one image.

## Regenerating

```
pnpm qa:capture
```

The capture run builds and serves production first, for the same reason the gate
suite does (MTS-DEC-011, MTS-OBS-014): evidence must come from the build under
test. It writes into this directory and overwrites what is here.

It is deliberately not part of `pnpm test:e2e`. A capture run that "passes"
proves only that files were written, and Gate 2 is a judgement the owner makes,
not an assertion a suite can carry. Each capture does, however, wait for the
evidence that its state is real before the shutter opens, so a render is never
filed under a state it did not reach.
