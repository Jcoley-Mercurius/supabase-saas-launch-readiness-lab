/*
 * Evidence-state glyphs.
 *
 * The approved canonical references (MDS-REF-001 core system, MDS-REF-003
 * component library, MDS-REF-005 scenario cards, MDS-REF-006 guided lab) all
 * render evidence state as a FILLED semantic badge with a knocked-out white
 * glyph, not as an outline icon. That treatment is what makes a state readable
 * at a glance in a dense evidence surface, and it is deliberately distinct from
 * the outline icons used for navigation and pillars.
 *
 * Shape carries the state independently of colour, so the meaning survives for
 * a viewer who cannot distinguish the semantic hues (MDS-DONT-002):
 *
 *   vulnerable      filled TRIANGLE, exclamation
 *   remediated      filled circle, check
 *   untested        filled circle, open ring   (visibly "no result", not a mark)
 *   not applicable  filled circle, minus
 *   warning         filled circle, exclamation
 *   unavailable     filled circle, cloud with a slash
 *   running         outline spinner (DESIGN-SYSTEM section 7: "loader plus text")
 *
 * These are the assignments in mds/COMPONENTS-PROPOSAL.md ("Evidence-state
 * system"): vulnerable alert-triangle, warning alert-circle, unavailable
 * cloud-off. S1 shipped vulnerable and warning inverted, which left warning and
 * unavailable rendering identically - same glyph, same hue, same tinted surface
 * - so the two were separated only by their label text (MTS-OBS-017).
 * Owner-approved on 2026-09-06, closing MDS-GAP-S1-002. The written component
 * spec supplies the shapes; the canonical references supply the filled-badge
 * treatment they are drawn in. Every state now has its own silhouette or mark.
 *
 * The glyph is always decorative; the adjacent canonical label and explanation
 * carry the meaning.
 */

export type StateGlyphShape =
  | "info-circle"
  | "exclamation-circle"
  | "check-circle"
  | "ring-circle"
  | "minus-circle"
  | "cloud-off-circle"
  | "exclamation-triangle";

export function StateGlyph({
  shape,
  size = 20,
  className,
}: {
  shape: StateGlyphShape;
  size?: 16 | 20 | 24;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    "aria-hidden": true as const,
    focusable: "false" as const,
    className,
  };

  // White knockout, drawn on top of the filled body.
  const mark = {
    stroke: "#fff",
    strokeWidth: 2.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  if (shape === "exclamation-triangle") {
    return (
      <svg {...common}>
        <path
          d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path d="M12 10.5v3.5" {...mark} />
        <path d="M12 17.2h.01" {...mark} />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      {shape === "check-circle" ? (
        <path d="m8.4 12.3 2.5 2.5 4.7-5" {...mark} />
      ) : null}
      {shape === "exclamation-circle" ? (
        <>
          <path d="M12 7.4v5" {...mark} />
          <path d="M12 16.3h.01" {...mark} />
        </>
      ) : null}
      {shape === "info-circle" ? (
        <>
          <path d="M12 11.4v5" {...mark} />
          <path d="M12 7.9h.01" {...mark} />
        </>
      ) : null}
      {shape === "minus-circle" ? <path d="M7.8 12h8.4" {...mark} /> : null}
      {/*
       * Unavailable: a cloud with a slash through it. Drawn thinner than the
       * other marks (1.9 against 2.25) because it carries more line in the
       * same 24px badge, and the slash runs corner to corner so the state
       * reads as "not retrievable" even at the 16px size.
       */}
      {shape === "cloud-off-circle" ? (
        <>
          <path
            d="M8.4 15.8h6.9a2.6 2.6 0 0 0 .3-5.2 4 4 0 0 0-6.6-2.2"
            {...mark}
            strokeWidth={1.9}
          />
          <path
            d="M8.4 15.8a2.6 2.6 0 0 1-.3-5.2"
            {...mark}
            strokeWidth={1.9}
          />
          <path d="M6.9 6.9l10.2 10.2" {...mark} strokeWidth={1.9} />
        </>
      ) : null}
      {/*
       * Untested renders as a thick annulus — a knocked-out hole rather than a
       * mark — so "no result" reads as an absence at a glance and can never be
       * mistaken for a completed check (MDS-REF-003, MDS-REF-005).
       */}
      {shape === "ring-circle" ? (
        <circle cx="12" cy="12" r="4.6" fill="#fff" />
      ) : null}
    </svg>
  );
}
