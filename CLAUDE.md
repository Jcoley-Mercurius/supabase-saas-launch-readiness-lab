@AGENTS.md

---

## Tool-managed appendix

The block below is generated and re-applied by `next dev`. It is hosted here, not in `AGENTS.md`,
so the canonical agent contract stays pristine and under change control. Next.js writes to
whichever of `AGENTS.md` / `CLAUDE.md` already holds its markers, replaces only the text between
them, and preserves surrounding content — so this placement is stable across dev runs and Next
upgrades. Do not move it into `AGENTS.md`, and do not hand-edit inside the markers.

It is tool guidance only. It carries no product, design, or technology authority and never
outranks approved MPS, MDS, or MTS artifacts.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
