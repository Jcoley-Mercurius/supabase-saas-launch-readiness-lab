import Link from "next/link";
import { CoverageMatrix } from "@/components/evidence/coverage-matrix";
import { StateGlyph } from "@/components/ui/state-glyph";
import {
  evidenceStateForeground,
  evidenceStateGlyph,
  evidenceStateLabel,
  type EvidenceState,
} from "@/components/ui/status-indicator";
import type { ReportModel } from "@/lib/evidence/report";

/*
 * Landing sample-report preview (MDS-REF-002 "Sample report preview"; MDS
 * COMPOSITION-PROPOSAL landing shell section 5 — "severity-ranked finding
 * sample and RLS matrix excerpt").
 *
 * Resolves the remaining half of the S1 deferral MTS-DEV-001. Both regions are
 * built from the same derived report model the report route uses, so the
 * preview cannot show a finding, a severity, or a state that the report does
 * not.
 *
 * It is a preview by extent, not by precision: it shows every documented
 * finding at summary depth and links to the report for the evidence. Nothing
 * is softened or rounded on the way here.
 */

function StateBadge({ state }: { state: EvidenceState }) {
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

export function ReportPreview({ model }: { model: ReportModel }) {
  return (
    /*
     * Stacked rather than side by side. The coverage matrix carries four
     * operation columns plus a resource column, and in a half-width column it
     * scrolls all four out of view — leaving a matrix excerpt that shows no
     * coverage. The approved rule is that horizontal scrolling is permitted
     * only with row identity preserved, not that the substance may scroll away
     * at rest.
     */
    <div className="flex min-w-0 flex-col gap-6">
      <div className="rounded-card border-line bg-base relative min-w-0 overflow-x-auto border">
        <table className="text-body-sm w-full border-collapse">
          <caption className="text-body-sm text-subtle border-line bg-muted border-b px-4 py-3 text-left">
            Documented findings, in report order. Severity and state are the
            recorded ones.
          </caption>
          <thead>
            <tr className="border-line border-b">
              <th
                scope="col"
                className="text-label text-subtle bg-base sticky left-0 px-4 py-3 text-left"
              >
                Finding
              </th>
              <th
                scope="col"
                className="text-label text-subtle px-4 py-3 text-left"
              >
                Severity
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
            {model.findings.map((finding) => (
              <tr
                key={finding.id}
                className="border-line border-b align-top last:border-b-0"
              >
                <th
                  scope="row"
                  className="bg-base sticky left-0 px-4 py-3 text-left font-normal"
                >
                  <Link
                    href={`/report#finding-${finding.id}`}
                    className="text-strong hover:text-primary font-semibold underline underline-offset-4"
                  >
                    {finding.finding}
                  </Link>
                  <span className="text-body-sm text-subtle mt-0.5 block">
                    {finding.pillar}
                  </span>
                </th>
                <td className="text-strong px-4 py-3">{finding.severity}</td>
                <td className="px-4 py-3">
                  <StateBadge state={finding.asFound.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CoverageMatrix
        rows={model.matrix.asFound}
        caption="RLS coverage matrix, as found. Every operation is classified; an operation with no documented check is untested, never a pass."
      />
    </div>
  );
}
