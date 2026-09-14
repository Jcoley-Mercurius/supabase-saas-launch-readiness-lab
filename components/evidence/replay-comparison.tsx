import { COMPARISON_REGION_ID } from "@/components/evidence/before-after";
import { CodeExcerpt } from "@/components/evidence/code-excerpt";
import { DeliveryLedger } from "@/components/evidence/delivery-ledger";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  buildSequenceExcerptTabs,
  formatCents,
} from "@/lib/evidence/replay-present";
import type {
  HandlerSnapshot,
  RecordedSequence,
} from "@/lib/evidence/replay-types";

/*
 * Before / after comparison for documented delivery sequences (MDS
 * COMPONENTS-PROPOSAL "Before/after comparison"; DESIGN-SYSTEM.md §10;
 * MDS-REF-003, MDS-REF-006, MDS-REF-009 panel 3).
 *
 * The pairing is per documented sequence, for the same reason the S2
 * comparison pairs per documented test: stacking every before panel in one
 * column and every after panel in the other produces two columns of different
 * heights whose rows no longer line up, which loses the "paired columns with
 * synchronized labels and equal hierarchy" the approved component requires.
 *
 * Below desktop each pair collapses to a vertical sequence with the vulnerable
 * state first, separated by an arrow rather than by colour alone, and the
 * persistent comparison summary sits beneath the whole set.
 */

function CountsSummary({ recorded }: { recorded: RecordedSequence }) {
  return (
    <dl className="text-body-sm grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
      <dt className="text-subtle font-semibold">Required</dt>
      <dd className="text-strong">
        {recorded.expected_commitments} commitment
        {recorded.expected_commitments === 1 ? "" : "s"} ·{" "}
        {formatCents(recorded.expected_applied_cents)}
      </dd>
      <dt className="text-subtle font-semibold">Observed</dt>
      <dd className="text-strong">
        {recorded.observed_commitments} commitment
        {recorded.observed_commitments === 1 ? "" : "s"} ·{" "}
        {formatCents(recorded.observed_applied_cents)}
      </dd>
      <dt className="text-subtle font-semibold">Step checkpoints</dt>
      <dd className="text-strong">
        {recorded.checkpoints_held
          ? "Every checkpoint held"
          : "At least one checkpoint did not hold"}
      </dd>
    </dl>
  );
}

function ComparisonColumn({
  heading,
  recorded,
  handler,
  provenance,
  showArrow = false,
}: {
  heading: string;
  recorded: RecordedSequence | null;
  handler: HandlerSnapshot | null;
  provenance: string;
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

      {recorded && handler ? (
        <Card className="flex min-w-0 flex-col gap-4 p-5">
          <StatusIndicator
            state={recorded.evidence_state}
            variant="block"
            explanation={
              recorded.evidence_state === "remediated"
                ? "The documented sequence produced the required end state, and every step checkpoint held."
                : recorded.evidence_state === "warning"
                  ? "A legitimate path did not produce the required end state. This needs qualification before anything is concluded from it."
                  : "The documented sequence did not produce the required end state. The evidence of each delivery decision is below."
            }
          />
          <CountsSummary recorded={recorded} />
          <CodeExcerpt
            tabs={buildSequenceExcerptTabs(recorded, handler)}
            caption={provenance}
            redaction="No signature value, signing string, or payload body is shown. The log records whether each signature verified, which is the fact under test."
          />
        </Card>
      ) : (
        <StatusIndicator
          state="untested"
          variant="block"
          explanation="The remediated handler configuration has not been applied in this session. There is no after result yet, and the absence of one is not a pass."
        />
      )}
    </div>
  );
}

export function ReplayComparison({
  before,
  after,
  beforeHandler,
  afterHandler,
  limitation,
  provenance,
  summary,
}: {
  before: RecordedSequence[];
  /** Null until the repeated run has been made. */
  after: RecordedSequence[] | null;
  beforeHandler: HandlerSnapshot;
  afterHandler: HandlerSnapshot | null;
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
          after?.find((item) => item.sequence_id === recorded.sequence_id) ??
          null;

        return (
          <article
            key={recorded.sequence_id}
            className="flex min-w-0 flex-col gap-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-h4 text-strong">{recorded.title}</h3>
              <p className="text-label text-subtle font-mono">
                {recorded.sequence_id}
              </p>
            </div>

            {/*
             * The parts that are identical on both sides of the pair, stated
             * once: what the sequence does, what the correct end state is, and
             * the plain-language consequence of getting it wrong.
             */}
            <dl className="text-body-sm tablet:grid-cols-[auto_minmax(0,1fr)] grid grid-cols-1 gap-x-6 gap-y-1">
              <dt className="text-subtle font-semibold">What is delivered</dt>
              <dd className="text-strong">{recorded.intent}</dd>
              <dt className="text-subtle font-semibold">Correct end state</dt>
              <dd className="text-strong">{recorded.expectation_text}</dd>
            </dl>
            <p className="text-body text-subtle">{recorded.consequence}</p>

            <div className="desktop:grid-cols-2 grid grid-cols-1 items-start gap-4">
              <ComparisonColumn
                heading="Before — vulnerable handler"
                recorded={recorded}
                handler={beforeHandler}
                provenance={provenance}
              />
              <ComparisonColumn
                heading="After — remediated handler"
                recorded={repeated}
                handler={afterHandler}
                provenance={provenance}
                showArrow
              />
            </div>

            {/*
             * The same deliveries in scannable form. It is a disclosure rather
             * than always-open because it repeats what the log excerpt above
             * already states in full; the evidence state, the counts, and the
             * limitation all stay outside it, so nothing material is concealed
             * by a collapsed control (DESIGN-SYSTEM.md §11).
             */}
            <details className="rounded-card border-line bg-canvas min-w-0 border p-4">
              <summary className="text-body-sm text-strong min-h-11 cursor-pointer font-semibold">
                Delivery-by-delivery ledger for {recorded.sequence_id}
              </summary>
              <div className="mt-4 flex min-w-0 flex-col gap-6">
                <DeliveryLedger
                  sequence={recorded}
                  caption={`Every delivery in ${recorded.sequence_id} under the vulnerable handler configuration, with the state it left behind after each one. Derived from the recorded run, not authored.`}
                />
                {repeated ? (
                  <DeliveryLedger
                    sequence={repeated}
                    caption={`The identical deliveries in ${recorded.sequence_id} under the remediated handler configuration. Nothing about the events changed — only the handler.`}
                  />
                ) : null}
              </div>
            </details>

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
