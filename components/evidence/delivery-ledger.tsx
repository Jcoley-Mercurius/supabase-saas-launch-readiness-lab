import {
  DECISION_LABELS,
  type RecordedSequence,
} from "@/lib/evidence/replay-types";
import { formatCents } from "@/lib/evidence/replay-present";

/*
 * Delivery ledger (MDS COMPONENTS-PROPOSAL "Component applicability —
 * tables/matrix"; DESIGN-SYSTEM.md §10; MDS-REF-006).
 *
 * This is the approved matrix/table component applied to a delivery sequence
 * rather than to resources and operations. It introduces no new visual
 * convention: it reuses the coverage matrix's structure — bordered surface,
 * caption, sticky row identity, controlled horizontal overflow — and the same
 * rule that no cell may carry meaning by colour alone.
 *
 * Deliberately, a step does NOT render a canonical evidence state. A single
 * delivery is not a verdict: "skipped as duplicate" is correct behaviour in
 * one sequence and silent data loss in another, and only the sequence as a
 * whole can say which. The evidence state is therefore shown once, for the
 * sequence, by the panel that contains this table. What a row carries is what
 * was recorded: the decision the handler reached and the state it left behind.
 */

export function DeliveryLedger({
  sequence,
  caption,
}: {
  sequence: RecordedSequence;
  caption: string;
}) {
  return (
    /*
     * `relative` is load-bearing for the same reason it is in the coverage
     * matrix: the sr-only spans below are position:absolute, and without a
     * positioned ancestor they resolve against the initial containing block
     * and extend the PAGE's scrollable width from inside a scrolled table.
     */
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
              Step
            </th>
            <th
              scope="col"
              className="text-label text-subtle px-4 py-3 text-left"
            >
              Delivery
            </th>
            <th
              scope="col"
              className="text-label text-subtle px-4 py-3 text-left"
            >
              Logical event
            </th>
            <th
              scope="col"
              className="text-label text-subtle px-4 py-3 text-left"
            >
              Handler decision
            </th>
            <th
              scope="col"
              className="text-label text-subtle px-4 py-3 text-right"
            >
              Commitments after
            </th>
            <th
              scope="col"
              className="text-label text-subtle px-4 py-3 text-right"
            >
              Applied after
            </th>
          </tr>
        </thead>
        <tbody>
          {sequence.steps.map((step) => (
            <tr
              key={step.ordinal}
              className="border-line border-b align-top last:border-b-0"
            >
              <th
                scope="row"
                className="text-strong bg-base sticky left-0 max-w-[18rem] min-w-[12rem] px-4 py-3 text-left font-normal"
              >
                <span className="text-strong font-semibold">
                  {step.ordinal}. {step.label}
                </span>
                <span className="text-body-sm text-subtle mt-1 block">
                  {step.note}
                </span>
              </th>

              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-strong font-mono">
                  {step.delivery_id}
                </span>
                <span className="text-body-sm text-subtle mt-1 block">
                  Attempt {step.attempt} · sequence {step.sequence_number}
                </span>
                <span className="text-body-sm text-subtle block">
                  Signature{" "}
                  {step.signature_valid ? "verifies" : "does not verify"}
                </span>
              </td>

              <td className="px-4 py-3">
                <span className="text-strong font-mono break-all">
                  {step.event_id}
                </span>
                <span className="text-body-sm text-subtle mt-1 block">
                  {formatCents(step.amount_cents)} · {step.invoice_number}
                </span>
              </td>

              <td className="min-w-[18rem] px-4 py-3">
                <span className="text-strong font-semibold">
                  {DECISION_LABELS[step.decision]}
                </span>
                <span className="text-body-sm text-subtle mt-1 block">
                  {step.detail}
                </span>
                {step.expected_commitments_after !== null ? (
                  <span
                    className={`text-body-sm mt-2 block font-semibold ${
                      step.checkpoint_met
                        ? "text-remediated"
                        : "text-vulnerable"
                    }`}
                  >
                    Checkpoint: {step.expected_commitments_after} commitment
                    {step.expected_commitments_after === 1 ? "" : "s"} required
                    at this step —{" "}
                    {step.checkpoint_met ? "held" : "did not hold"}.
                  </span>
                ) : null}
              </td>

              <td className="text-strong px-4 py-3 text-right tabular-nums">
                {step.commitments_after}
              </td>
              <td className="text-strong px-4 py-3 text-right whitespace-nowrap tabular-nums">
                {formatCents(step.applied_cents_after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
