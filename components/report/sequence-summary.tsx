import { StateGlyph } from "@/components/ui/state-glyph";
import {
  evidenceStateForeground,
  evidenceStateGlyph,
  evidenceStateLabel,
} from "@/components/ui/status-indicator";
import { formatCents } from "@/lib/evidence/replay-present";
import type { RecordedSequence } from "@/lib/evidence/replay-types";

/*
 * Webhook and recovery evidence across every documented sequence (MDS
 * COMPOSITION-PROPOSAL "Audit report shell" section 5).
 *
 * This is the approved matrix/table component applied to documented sequences,
 * exactly as the delivery ledger applies it to deliveries — bordered surface,
 * caption, sticky row identity, controlled horizontal overflow, and no cell
 * carrying meaning by colour alone. It introduces no new convention.
 *
 * Both configurations appear on one row because the comparison is the point:
 * the deliveries are identical in both runs and only the handler differs, so
 * the two states beside each other are the evidence.
 *
 * The checkpoint column is not decoration. One sequence reaches the correct
 * final count under the broken handler because a lost retry and a
 * double-counted replay cancel out, and only the step checkpoint shows that the
 * end state was reached by two errors rather than by correct handling.
 */

function StateCell({ sequence }: { sequence: RecordedSequence | undefined }) {
  if (!sequence) {
    return (
      <span className="text-untested inline-flex items-center gap-2">
        <StateGlyph shape="cloud-off-circle" size={16} />
        <span className="text-body-sm">
          {evidenceStateLabel("unavailable")}
        </span>
      </span>
    );
  }

  const state = sequence.evidence_state;
  return (
    <span
      className={`inline-flex items-center gap-2 ${evidenceStateForeground(state)}`}
    >
      <StateGlyph
        shape={evidenceStateGlyph(state) ?? "ring-circle"}
        size={16}
      />
      <span className="text-body-sm">{evidenceStateLabel(state)}</span>
    </span>
  );
}

export function SequenceSummary({
  asFound,
  afterFix,
  caption,
}: {
  asFound: RecordedSequence[];
  afterFix: RecordedSequence[];
  caption: string;
}) {
  return (
    <div className="rounded-card border-line relative min-w-0 overflow-x-auto border">
      <table className="text-body-sm w-full border-collapse">
        <caption className="text-body-sm text-subtle border-line bg-muted border-b px-4 py-3 text-left">
          {caption}
        </caption>
        <thead>
          <tr className="border-line border-b">
            <th
              scope="col"
              className="text-label text-subtle bg-base sticky left-0 px-4 py-3 text-left"
            >
              Sequence
            </th>
            <th
              scope="col"
              className="text-label text-subtle px-4 py-3 text-left"
            >
              Required end state
            </th>
            <th
              scope="col"
              className="text-label text-subtle px-4 py-3 text-left"
            >
              As found
            </th>
            <th
              scope="col"
              className="text-label text-subtle px-4 py-3 text-left"
            >
              After the documented fix
            </th>
          </tr>
        </thead>
        <tbody>
          {asFound.map((sequence) => {
            const repeated = afterFix.find(
              (item) => item.sequence_id === sequence.sequence_id,
            );

            return (
              <tr
                key={sequence.sequence_id}
                className="border-line border-b align-top last:border-b-0"
              >
                <th
                  scope="row"
                  className="text-strong bg-base sticky left-0 px-4 py-3 text-left font-normal"
                >
                  <span className="font-mono">{sequence.sequence_id}</span>
                  <span className="text-body-sm text-subtle mt-0.5 block max-w-[34ch]">
                    {sequence.title}
                  </span>
                </th>
                <td className="text-subtle max-w-[34ch] px-4 py-3">
                  {sequence.expectation_text}
                </td>
                <td className="px-4 py-3">
                  <StateCell sequence={sequence} />
                  <span className="text-body-sm text-subtle mt-1 block">
                    {sequence.observed_commitments} committed ·{" "}
                    {formatCents(sequence.observed_applied_cents)} applied ·{" "}
                    {sequence.checkpoints_held
                      ? "every checkpoint held"
                      : "a step checkpoint did not hold"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StateCell sequence={repeated} />
                  {repeated ? (
                    <span className="text-body-sm text-subtle mt-1 block">
                      {repeated.observed_commitments} committed ·{" "}
                      {formatCents(repeated.observed_applied_cents)} applied ·{" "}
                      {repeated.checkpoints_held
                        ? "every checkpoint held"
                        : "a step checkpoint did not hold"}
                    </span>
                  ) : (
                    <span className="text-body-sm text-subtle mt-1 block">
                      No recorded run exists for this sequence under the
                      remediated handler in this build. The absence of a result
                      is not a pass.
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
