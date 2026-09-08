import type { ReactNode } from "react";

/*
 * One numbered section of the report shell (MDS COMPOSITION-PROPOSAL "Audit
 * report shell"; MDS-REF-007).
 *
 * The heading carries the section id so the sticky index and the in-flow table
 * of contents both address it, and `scroll-mt` keeps the heading clear of the
 * sticky site header when an anchor is followed.
 *
 * Prose is capped at the approved 760px reading measure while the section
 * itself spans the wider report shell, which is exactly the approved rule:
 * "Reading/report prose 760px — single readable column nested within the wider
 * report shell". Evidence, matrices, and tables are handed the full width by
 * being rendered outside the prose wrapper.
 */
export function ReportSection({
  id,
  heading,
  intro,
  children,
}: {
  id: string;
  heading: string;
  /** Optional standfirst, rendered at the reading measure. */
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      /*
       * `min-w-0` is load-bearing. The section is a flex item, and a flex
       * item's default `min-width: auto` lets it grow to its widest
       * descendant — here the code excerpt's pre-formatted evidence lines,
       * which are far wider than a phone. Without it the excerpt's own
       * scroller is bypassed and the whole PAGE scrolls sideways, which the
       * approved responsive rules forbid.
       */
      className="border-line min-w-0 scroll-mt-24 border-t pt-10 first:border-t-0 first:pt-0"
    >
      <h2 id={`${id}-heading`} className="text-h2 text-strong">
        {heading}
      </h2>
      {intro ? (
        <div className="text-body-lg text-subtle mt-4 max-w-[760px]">
          {intro}
        </div>
      ) : null}
      <div className="mt-6 flex min-w-0 flex-col gap-6">{children}</div>
    </section>
  );
}

/** Prose held to the approved 760px reading measure inside the wider shell. */
export function ReportProse({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`max-w-[760px] ${className}`.trim()}>{children}</div>;
}
