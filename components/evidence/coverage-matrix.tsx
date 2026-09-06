import { StateGlyph, type StateGlyphShape } from "@/components/ui/state-glyph";
import {
  evidenceStateLabel,
  type EvidenceState,
} from "@/components/ui/status-indicator";
import { MATRIX_OPERATIONS, type MatrixOperation } from "@/lib/evidence/matrix";
import type { MatrixRow } from "@/lib/evidence/types";

/*
 * RLS coverage matrix (MDS COMPONENTS-PROPOSAL "RLS coverage matrix";
 * DESIGN-SYSTEM.md §10; MDS-REF-006).
 *
 * Approved behaviour implemented here:
 *  - rows are protected resources, columns are operations;
 *  - every cell uses the canonical evidence-state vocabulary;
 *  - horizontal scrolling is permitted on small screens only with row identity
 *    preserved, so the resource column is sticky;
 *  - no cell carries meaning by colour alone. Each one renders a shape and a
 *    visually hidden canonical label, and its full reason is exposed through
 *    the cell title and the reason list beneath the table.
 *
 * MPS-ACC-005 is the governing rule: every displayed check is classified, and
 * a missing check is shown as Untested, never left to look like a pass.
 */

const CELL: Record<EvidenceState, { glyph: StateGlyphShape; fg: string }> = {
  vulnerable: { glyph: "exclamation-circle", fg: "text-vulnerable" },
  remediated: { glyph: "check-circle", fg: "text-remediated" },
  untested: { glyph: "ring-circle", fg: "text-untested" },
  "not-applicable": { glyph: "minus-circle", fg: "text-untested" },
  warning: { glyph: "exclamation-triangle", fg: "text-warning" },
  unavailable: { glyph: "exclamation-triangle", fg: "text-warning" },
  running: { glyph: "ring-circle", fg: "text-info" },
};

const LEGEND: EvidenceState[] = [
  "remediated",
  "vulnerable",
  "untested",
  "not-applicable",
];

function operationLabel(operation: MatrixOperation) {
  return operation.charAt(0).toUpperCase() + operation.slice(1);
}

export function CoverageMatrix({
  rows,
  caption,
}: {
  rows: MatrixRow[];
  caption: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/*
       * `relative` is load-bearing. The cells carry their canonical state as
       * sr-only text, and Tailwind's sr-only is position:absolute. Without a
       * positioned ancestor those spans resolve against the initial containing
       * block, so inside a horizontally scrolled table they land far to the
       * right and extend the PAGE's scrollable area — the table scrolls
       * correctly while the whole page also scrolls sideways. Establishing a
       * containing block here keeps them inside the scroller.
       */}
      <div className="rounded-card border-line relative overflow-x-auto border">
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
                Resource
              </th>
              {MATRIX_OPERATIONS.map((operation) => (
                <th
                  key={operation}
                  scope="col"
                  className="text-label text-subtle px-4 py-3 text-center"
                >
                  {operationLabel(operation)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.resource}
                className="border-line border-b last:border-b-0"
              >
                <th
                  scope="row"
                  className="text-strong bg-base sticky left-0 px-4 py-3 text-left font-mono font-normal whitespace-nowrap"
                >
                  {row.resource}
                  <span className="text-body-sm text-subtle mt-0.5 block font-sans">
                    {row.rowSecurity
                      ? "Row level security enabled"
                      : "Row level security not enabled"}
                  </span>
                </th>
                {MATRIX_OPERATIONS.map((operation) => {
                  const cell = row.cells[operation];
                  const spec = CELL[cell.state];
                  return (
                    <td key={operation} className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex flex-col items-center gap-1 ${spec.fg}`}
                        title={cell.reason}
                      >
                        <StateGlyph shape={spec.glyph} size={20} />
                        <span className="sr-only">
                          {operationLabel(operation)}:{" "}
                          {evidenceStateLabel(cell.state)}. {cell.reason}
                        </span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {LEGEND.map((state) => (
          <li key={state} className="flex items-center gap-2">
            <span className={CELL[state].fg}>
              <StateGlyph shape={CELL[state].glyph} size={16} />
            </span>
            <span className="text-body-sm text-subtle">
              {evidenceStateLabel(state)}
            </span>
          </li>
        ))}
      </ul>

      {/*
       * The reason for every non-result cell, in text. A tooltip is not an
       * accessible carrier on its own, and MPS-ACC-005 requires the buyer to be
       * able to see why a check has no result.
       */}
      <details className="rounded-card border-line bg-canvas border p-4">
        <summary className="text-body-sm text-strong min-h-11 cursor-pointer font-semibold">
          Why each check holds its state
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {rows.flatMap((row) =>
            MATRIX_OPERATIONS.map((operation) => (
              <li
                key={`${row.resource}-${operation}`}
                className="text-body-sm text-subtle"
              >
                <span className="text-strong font-mono">
                  {row.resource}.{operation}
                </span>{" "}
                —{" "}
                <span className="font-semibold">
                  {evidenceStateLabel(row.cells[operation].state)}
                </span>
                . {row.cells[operation].reason}
              </li>
            )),
          )}
        </ul>
      </details>
    </div>
  );
}
