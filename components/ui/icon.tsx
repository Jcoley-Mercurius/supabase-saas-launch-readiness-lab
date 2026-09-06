import type { SVGProps } from "react";

/*
 * Iconography — MDS icons.family: "Lucide-style outline", 1.75-2px stroke,
 * 16/20/24px sizes (MDS-DEC-011).
 *
 * MDS records `icons.implementation: mts_to_select`, and the approved MTS
 * technology set (mts/TECHNOLOGY-BLUEPRINT.md) names no icon package. Adding
 * a dependency would be an unapproved technology selection, so S1 draws the
 * required glyphs inline in the approved outline style. This is reported as an
 * open MTS decision, not a design change.
 *
 * Icons are decorative by default (aria-hidden). Every evidence state pairs its
 * icon with a visible text label and explanation, so meaning never depends on
 * the glyph or on colour (MDS-PRI-003, MDS-DONT-002).
 *
 * Prohibited motifs — shields, locks, bugs, keyholes, hacker silhouettes,
 * neon circuitry — are absent by construction (mds/specification/DO-DONT.md).
 */

const ICON_PATHS = {
  // --- Risk pillars -------------------------------------------------------
  users: (
    <>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-6A3.5 3.5 0 0 0 3 17.5V19" />
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M21 19v-1.5a3.5 3.5 0 0 0-2.6-3.4" />
      <path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
      <path d="M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
    </>
  ),
  webhook: (
    <>
      <path d="M9.4 9.2a3.2 3.2 0 1 1 4.4 3l-2.6 4.6" />
      <path d="M14.6 14.8a3.2 3.2 0 1 1 1.6 5.2H10.9" />
      <path d="M9.4 20a3.2 3.2 0 1 1-2.8-4.8l2.7-4.6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a1.9 1.9 0 0 1-3.8 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3.4a1.9 1.9 0 0 1 0-3.8h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3.4a1.9 1.9 0 0 1 3.8 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 0 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </>
  ),

  // --- Evidence-state vocabulary (DESIGN-SYSTEM.md §7 / §9) --------------
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.2 2.6 2.6 5-5.2" />
    </>
  ),
  "alert-triangle": (
    <>
      <path d="M10.6 4.1 2.9 17a1.6 1.6 0 0 0 1.4 2.4h15.4a1.6 1.6 0 0 0 1.4-2.4L13.4 4.1a1.6 1.6 0 0 0-2.8 0Z" />
      <path d="M12 9.5v4" />
      <path d="M12 17h.01" />
    </>
  ),
  "minus-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.4 12h7.2" />
    </>
  ),
  "slash-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 18.4 12.8-12.8" />
    </>
  ),
  loader: (
    <>
      <path d="M12 3v3.5" />
      <path d="M12 17.5V21" />
      <path d="M5.6 5.6 8 8" />
      <path d="m16 16 2.4 2.4" />
      <path d="M3 12h3.5" />
      <path d="M17.5 12H21" />
      <path d="M5.6 18.4 8 16" />
      <path d="M16 8l2.4-2.4" />
    </>
  ),
  "cloud-off": (
    <>
      <path d="M7 17.5h9.5a4 4 0 0 0 1.6-7.7 6 6 0 0 0-8.3-4.2" />
      <path d="M7.2 9.1A4.7 4.7 0 0 0 7 17.5" />
      <path d="m3.5 3.5 17 17" />
    </>
  ),
  "alert-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.8v4.6" />
      <path d="M12 16.2h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.2" />
      <path d="M12 7.8h.01" />
    </>
  ),

  // --- Synthetic context and boundary ------------------------------------
  flask: (
    <>
      <path d="M9.5 3v5.6L4.4 17a1.7 1.7 0 0 0 1.5 2.6h12.2A1.7 1.7 0 0 0 19.6 17l-5.1-8.4V3" />
      <path d="M8.4 3h7.2" />
      <path d="M7.3 13.4h9.4" />
    </>
  ),
  user: (
    <>
      <path d="M19 19.5v-1.2a4.3 4.3 0 0 0-4.3-4.3H9.3A4.3 4.3 0 0 0 5 18.3v1.2" />
      <circle cx="12" cy="8" r="3.8" />
    </>
  ),
  "credit-card": (
    <>
      <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.2" />
      <path d="M2.8 10h18.4" />
      <path d="M6.6 14.6h3" />
    </>
  ),
  "file-text": (
    <>
      <path d="M14 3H7.4A1.9 1.9 0 0 0 5.5 4.9v14.2A1.9 1.9 0 0 0 7.4 21h9.2a1.9 1.9 0 0 0 1.9-1.9V7.3Z" />
      <path d="M14 3v4.3h4.5" />
      <path d="M9 12.5h6" />
      <path d="M9 16h4.5" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.6" />
      <circle cx="18" cy="6" r="2.6" />
      <path d="M15.4 6H10a3.2 3.2 0 0 0 0 6.4h4a3.2 3.2 0 0 1 0 6.4H8.6" />
    </>
  ),

  // --- Navigation ---------------------------------------------------------
  "arrow-right": (
    <>
      <path d="M4.5 12h15" />
      <path d="m13.2 5.7 6.3 6.3-6.3 6.3" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="M19.5 12h-15" />
      <path d="M10.8 5.7 4.5 12l6.3 6.3" />
    </>
  ),
  "chevron-right": <path d="m9 5.5 6.5 6.5L9 18.5" />,
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
} as const;

export type IconName = keyof typeof ICON_PATHS;

export type IconProps = {
  name: IconName;
  /** MDS icons.sizes — small 16, default 20, large 24. */
  size?: 16 | 20 | 24;
  /**
   * Accessible name. Omit it (the default) whenever adjacent text already
   * carries the meaning, which is the case for every evidence state.
   */
  label?: string;
} & Omit<SVGProps<SVGSVGElement>, "children" | "name">;

export function Icon({ name, size = 20, label, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...props}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
