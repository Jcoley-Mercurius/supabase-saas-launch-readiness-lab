import { EvidencePanel } from "@/components/evidence/evidence-panel";
import { Icon } from "@/components/ui/icon";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { RecordedCase } from "@/lib/evidence/types";

/*
 * Before / after comparison (MDS COMPONENTS-PROPOSAL "Before/after comparison";
 * DESIGN-SYSTEM.md §10; MDS-REF-003, MDS-REF-006, MDS-REF-009 panel 3).
 *
 * The pairing is per documented test, not per column. Stacking every before
 * panel in one column and every after panel in the other produces two columns
 * of very different heights whose rows no longer line up, which loses the
 * "paired columns with synchronized labels and equal hierarchy" the approved
 * component specification requires. Pairing each test with its own repeat keeps
 * the labels synchronised and the hierarchy equal at every length.
 *
 * The section carries a stable id so components/measurement/record-in-view
 * can observe it without wrapping it in a node the approved composition does
 * not have.
 *
 * Below desktop each pair collapses to a vertical sequence with the vulnerable
 * state first, separated by an arrow rather than by colour alone, and the
 * persistent comparison summary sits beneath the whole set.
 */

/** Stable across both labs; only one comparison exists on a scenario page. */
export const COMPARISON_REGION_ID = "evidence-comparison";

function ComparisonColumn({
  heading,
  recorded,
  boundary,
  limitation,
  provenance,
  emptyExplanation,
  showArrow = false,
}: {
  heading: string;
  recorded: RecordedCase | null;
  boundary: string;
  limitation: string;
  provenance: string;
  emptyExplanation?: string;
  showArrow?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {showArrow ? (
        <span
          aria-hidden="true"
          className="desktop:hidden text-untested flex justify-center"
        >
          <Icon name="arrow-right" size={20} className="rotate-90" />
        </span>
      ) : null}
      <h4 className="text-label text-subtle uppercase">{heading}</h4>
      {recorded ? (
        <EvidencePanel
          recorded={recorded}
          boundary={boundary}
          limitation={limitation}
          provenance={provenance}
          layout="paired"
        />
      ) : (
        <StatusIndicator
          state="untested"
          variant="block"
          explanation={
            emptyExplanation ??
            "The remediated policy set has not been applied in this session. There is no after result yet, and the absence of one is not a pass."
          }
        />
      )}
    </div>
  );
}

export function EvidenceComparison({
  before,
  after,
  boundary,
  limitation,
  provenance,
  summary,
}: {
  before: RecordedCase[];
  /** Null until the repeated test has been run. */
  after: RecordedCase[] | null;
  boundary: string;
  limitation: string;
  provenance: string;
  summary: string;
}) {
  return (
    <section
      id={COMPARISON_REGION_ID}
      aria-label="Before and after comparison"
      className="flex min-w-0 flex-col gap-8"
    >
      {before.map((recorded) => {
        const repeated =
          after?.find((item) => item.case_id === recorded.case_id) ?? null;

        return (
          <article
            key={recorded.case_id}
            className="flex min-w-0 flex-col gap-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-h4 text-strong">{recorded.title}</h3>
              <p className="text-label text-subtle font-mono">
                {recorded.case_id}
              </p>
            </div>

            {/*
             * The parts that are identical on both sides of the pair, stated
             * once: affected boundary, acting identity, and the plain-language
             * consequence the approved evidence-panel contract requires.
             */}
            <dl className="text-body-sm tablet:grid-cols-[auto_minmax(0,1fr)] grid grid-cols-1 gap-x-6 gap-y-1">
              <dt className="text-subtle font-semibold">Affected boundary</dt>
              <dd className="text-strong">{boundary}</dd>
              <dt className="text-subtle font-semibold">Acting as</dt>
              <dd className="text-strong">{recorded.actor_label}</dd>
            </dl>
            <p className="text-body text-subtle">{recorded.consequence}</p>

            <div className="desktop:grid-cols-2 grid grid-cols-1 items-start gap-4">
              <ComparisonColumn
                heading="Before — vulnerable state"
                recorded={recorded}
                boundary={boundary}
                limitation={limitation}
                provenance={provenance}
              />
              <ComparisonColumn
                heading="After — remediated state"
                recorded={repeated}
                boundary={boundary}
                limitation={limitation}
                provenance={provenance}
                showArrow
              />
            </div>

            <p className="border-line text-body-sm text-subtle border-t pt-3">
              <span className="text-strong font-semibold">Limitation. </span>
              {limitation}
            </p>
          </article>
        );
      })}

      <p className="rounded-card border-line bg-canvas text-body-sm text-subtle border p-4">
        <span className="text-strong font-semibold">Comparison. </span>
        {summary}
      </p>
    </section>
  );
}
