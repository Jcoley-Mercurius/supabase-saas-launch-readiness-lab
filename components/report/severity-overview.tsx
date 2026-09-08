import { StateGlyph } from "@/components/ui/state-glyph";
import {
  evidenceStateForeground,
  evidenceStateGlyph,
  evidenceStateLabel,
  type EvidenceState,
} from "@/components/ui/status-indicator";
import type { AreaRow, ReportModel } from "@/lib/evidence/report";

/*
 * Severity overview (MDS COMPOSITION-PROPOSAL "Audit report shell" section 2:
 * "Severity overview with explicit counts by documented state"; MDS-REF-007
 * count tiles and "Findings by area").
 *
 * Every number here is derived in lib/evidence/report.ts from the recorded
 * transcripts. This component formats counts; it cannot produce one.
 *
 * No tile carries meaning by colour: each pairs the semantic hue with the
 * canonical evidence glyph, the count, a label, and an explanation, and the
 * canonical state label is read out for assistive technology. That is the same
 * four-carrier rule the evidence-state component enforces everywhere else.
 */

function Tile({
  state,
  count,
  label,
  explanation,
}: {
  state: EvidenceState;
  count: number;
  label: string;
  explanation: string;
}) {
  const fg = evidenceStateForeground(state);
  const glyph = evidenceStateGlyph(state) ?? "ring-circle";

  return (
    <li className="rounded-card border-line bg-base shadow-card flex items-start gap-3 border p-4">
      <span className={`mt-0.5 shrink-0 ${fg}`}>
        <StateGlyph shape={glyph} size={24} />
      </span>
      <div className="min-w-0">
        <p className={`text-h2 ${fg}`}>{count}</p>
        <p className="text-body-sm text-strong mt-1 font-semibold">{label}</p>
        <p className="text-body-sm text-subtle mt-1">{explanation}</p>
        <span className="sr-only">
          Recorded state: {evidenceStateLabel(state)}.
        </span>
      </div>
    </li>
  );
}

function AreaState({ state }: { state: EvidenceState }) {
  const fg = evidenceStateForeground(state);
  return (
    <span className={`inline-flex items-center gap-2 ${fg}`}>
      <StateGlyph
        shape={evidenceStateGlyph(state) ?? "ring-circle"}
        size={16}
      />
      <span className="text-body-sm">{evidenceStateLabel(state)}</span>
    </span>
  );
}

export function SeverityOverview({ model }: { model: ReportModel }) {
  const { checks, matrix, severityCounts, findings } = model;
  const untested =
    matrix.asFoundCounts.find((entry) => entry.state === "untested")?.count ??
    0;
  const notApplicable =
    matrix.asFoundCounts.find((entry) => entry.state === "not-applicable")
      ?.count ?? 0;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <ul className="tablet:grid-cols-2 wide:grid-cols-3 grid grid-cols-1 gap-4">
        {severityCounts.map((entry) => (
          <Tile
            key={entry.severity}
            state="vulnerable"
            count={entry.count}
            label={`${entry.severity} severity findings`}
            explanation={`Documented findings rated ${entry.severity.toLowerCase()}, each with the basis for that rating stated with it.`}
          />
        ))}
        <Tile
          state="vulnerable"
          count={checks.asFound.unmet}
          label="Checks unmet as found"
          explanation={`Of ${checks.asFound.total} documented checks run against the project as found, this many did not meet their documented expectation.`}
        />
        <Tile
          state="remediated"
          count={checks.afterFix.met}
          label="Checks constrained after the documented fix"
          explanation={`The identical ${checks.afterFix.total} checks, repeated against the remediated configuration. This is evidence for those checks and their documented scope, not for the areas as a whole.`}
        />
        <Tile
          state="untested"
          count={untested}
          label="Untested operations in the matrix"
          explanation="Reachable operations with no documented check in this build. No result exists for them, and an untested check is not a pass."
        />
        <Tile
          state="not-applicable"
          count={notApplicable}
          label="Not applicable"
          explanation="Operations no application role is granted, so no policy is consulted. The grant that makes each one not applicable is recorded with it."
        />
      </ul>

      <div className="rounded-card border-line relative min-w-0 overflow-x-auto border">
        <table className="text-body-sm w-full border-collapse">
          <caption className="text-body-sm text-subtle border-line bg-muted border-b px-4 py-3 text-left">
            Findings by area, in report order. Counts are of documented checks
            belonging to each area, derived from the recorded runs.
          </caption>
          <thead>
            <tr className="border-line border-b">
              <th
                scope="col"
                className="text-label text-subtle bg-base sticky left-0 px-4 py-3 text-left"
              >
                Area
              </th>
              <th
                scope="col"
                className="text-label text-subtle px-4 py-3 text-left"
              >
                Severity
              </th>
              <th
                scope="col"
                className="text-label text-subtle px-4 py-3 text-right"
              >
                Documented checks
              </th>
              <th
                scope="col"
                className="text-label text-subtle px-4 py-3 text-right"
              >
                Unmet as found
              </th>
              <th
                scope="col"
                className="text-label text-subtle px-4 py-3 text-right"
              >
                Unmet after fix
              </th>
              <th
                scope="col"
                className="text-label text-subtle px-4 py-3 text-left"
              >
                State as found
              </th>
            </tr>
          </thead>
          <tbody>
            {model.areas.map((area: AreaRow) => (
              <tr
                key={area.pillar}
                className="border-line border-b last:border-b-0"
              >
                <th
                  scope="row"
                  className="text-strong bg-base sticky left-0 px-4 py-3 text-left font-semibold whitespace-nowrap"
                >
                  {area.pillar}
                </th>
                <td className="text-strong px-4 py-3">{area.severity}</td>
                <td className="text-strong px-4 py-3 text-right tabular-nums">
                  {area.checks}
                </td>
                <td className="text-strong px-4 py-3 text-right tabular-nums">
                  {area.unmetAsFound}
                </td>
                <td className="text-strong px-4 py-3 text-right tabular-nums">
                  {area.unmetAfterFix}
                </td>
                <td className="px-4 py-3">
                  <AreaState state={area.state} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-line bg-muted border-t">
              <th
                scope="row"
                className="text-strong bg-muted sticky left-0 px-4 py-3 text-left font-semibold"
              >
                All areas
              </th>
              <td className="text-subtle px-4 py-3">
                {findings.length} finding{findings.length === 1 ? "" : "s"}
              </td>
              <td className="text-strong px-4 py-3 text-right font-semibold tabular-nums">
                {checks.asFound.total}
              </td>
              <td className="text-strong px-4 py-3 text-right font-semibold tabular-nums">
                {checks.asFound.unmet}
              </td>
              <td className="text-strong px-4 py-3 text-right font-semibold tabular-nums">
                {checks.afterFix.unmet}
              </td>
              <td className="px-4 py-3">
                <AreaState state={checks.asFound.state} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
