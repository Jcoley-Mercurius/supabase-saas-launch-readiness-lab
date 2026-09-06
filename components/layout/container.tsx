import type { ReactNode } from "react";

/*
 * Container — approved maximum widths and page gutters
 * (DESIGN-SYSTEM.md §12, COMPOSITION-PROPOSAL "Grid and containers").
 *
 *   marketing 1200px | evidence 1360px | reading 760px
 *   gutters: 24 mobile / 32 tablet / 48 desktop
 */

const WIDTHS = {
  marketing: "max-w-[1200px]",
  evidence: "max-w-[1360px]",
  reading: "max-w-[760px]",
} as const;

/** 24 / 32 / 48px page gutters at the approved MDS breakpoints. */
export const PAGE_GUTTERS = "px-6 tablet:px-8 desktop:px-12";

export function Container({
  width = "marketing",
  className = "",
  children,
}: {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-auto w-full ${WIDTHS[width]} ${PAGE_GUTTERS} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/*
 * Section — approved major section rhythm: 56-64px mobile, 80-96px desktop
 * (MDS spacing.section_rules).
 */
export function Section({
  tone = "canvas",
  spacing = "major",
  className = "",
  children,
  ...props
}: {
  tone?: "canvas" | "base" | "muted" | "ink";
  spacing?: "major" | "compact";
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const tones = {
    canvas: "bg-canvas",
    base: "bg-base",
    muted: "bg-muted",
    ink: "bg-ink text-inverse on-ink",
  } as const;

  const rhythm =
    spacing === "major" ? "py-14 desktop:py-20" : "py-10 desktop:py-12";

  return (
    <section
      className={`${tones[tone]} ${rhythm} ${className}`.trim()}
      {...props}
    >
      {children}
    </section>
  );
}

/** Eyebrow label above a section heading (MDS-REF-002 "FOCUS AREAS"). */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-label text-subtle uppercase">{children}</p>;
}
