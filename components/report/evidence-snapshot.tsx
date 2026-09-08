import { CodeExcerpt } from "@/components/evidence/code-excerpt";
import { formatRecordedDate } from "@/components/report/report-header";
import { StateGlyph } from "@/components/ui/state-glyph";
import {
  evidenceStateForeground,
  evidenceStateGlyph,
  evidenceStateLabel,
  type EvidenceState,
} from "@/components/ui/status-indicator";
import { buildPolicySnapshot, type ReportModel } from "@/lib/evidence/report";

/*
 * Landing hero evidence snapshot (MDS-REF-002 "Evidence snapshot (synthetic
 * data)"; MDS COMPOSITION-PROPOSAL landing shell section 1 — "a compact
 * evidence snapshot rather than decorative art").
 *
 * Resolves the S1 deferral MTS-DEV-001. Every count and both policy excerpts
 * are derived from the committed transcripts, so the hero states the same
 * numbers the report does and cannot drift from them.
 *
 * It sits on the deep-ink hero, so the state glyphs carry their semantic hue
 * from the shared evidence-state component while the labels beside them are
 * rendered in inverse text — the canonical label is always present, and
 * meaning never rests on the hue against a dark surface.
 */

/*
 * The state hues are defined for light surfaces. On ink, `remediated`
 * (#087a55) measures below the AA body threshold, so the accent token — which
 * is the approved on-ink positive colour and is what MDS-REF-002 renders — is
 * used for the glyph there instead. Every other state's token clears AA on the
 * ink surface. The label and explanation are always present regardless.
 */
function glyphColour(state: EvidenceState): string {
  return state === "remediated"
    ? "text-accent"
    : evidenceStateForeground(state);
}

function SnapshotRow({
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
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 ${glyphColour(state)}`}>
        <StateGlyph
          shape={evidenceStateGlyph(state) ?? "ring-circle"}
          size={20}
        />
      </span>
      <span className="text-h4 text-inverse w-8 shrink-0 tabular-nums">
        {count}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-body-sm text-inverse font-semibold">{label}</span>
        <span className="text-body-sm text-inverse/70">{explanation}</span>
        <span className="sr-only">
          Recorded state: {evidenceStateLabel(state)}.
        </span>
      </span>
    </li>
  );
}

export function EvidenceSnapshot({ model }: { model: ReportModel }) {
  const snapshot = buildPolicySnapshot();
  const untested =
    model.matrix.asFoundCounts.find((entry) => entry.state === "untested")
      ?.count ?? 0;
  const notApplicable =
    model.matrix.asFoundCounts.find((entry) => entry.state === "not-applicable")
      ?.count ?? 0;

  return (
    <div className="border-inverse/15 bg-inverse/5 rounded-card border p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-h4 text-inverse">
          Evidence snapshot (synthetic data)
        </h2>
        <p className="text-label text-inverse/70 rounded-pill border-inverse/20 border px-2.5 py-1">
          Recorded {formatRecordedDate(model.recordedAt)}
        </p>
      </div>

      <ul className="mt-5 flex flex-col gap-4">
        {model.severityCounts.map((entry) => (
          <SnapshotRow
            key={entry.severity}
            state="vulnerable"
            count={entry.count}
            label={`${entry.severity} severity findings`}
            explanation="Each with the basis for the rating stated with it."
          />
        ))}
        <SnapshotRow
          state="vulnerable"
          count={model.checks.asFound.unmet}
          label="Checks unmet as found"
          explanation={`Of ${model.checks.asFound.total} documented checks run against the project as found.`}
        />
        <SnapshotRow
          state="remediated"
          count={model.checks.afterFix.met}
          label="Constrained after the documented fix"
          explanation="The identical checks, repeated. Evidence for those checks only."
        />
        <SnapshotRow
          state="untested"
          count={untested + notApplicable}
          label="Operations with no result"
          explanation={`${untested} untested and ${notApplicable} not applicable. An untested check is never a pass.`}
        />
      </ul>

      {snapshot ? (
        <div className="mt-6">
          <CodeExcerpt
            tabs={[
              {
                id: "policy",
                label: `Policy check (${snapshot.caseId})`,
                description: `The ${snapshot.policyName} policy on ${snapshot.resource} under both documented configurations, with the result documented test ${snapshot.caseId} produced against each.`,
                lines: [
                  `-- ${snapshot.resource} · policy ${snapshot.policyName}`,
                  `-- Documented test ${snapshot.caseId}: ${snapshot.caseTitle}`,
                  "",
                  "-- As found",
                  "select using (",
                  `  ${snapshot.asFound.predicate}`,
                  ");",
                  `  ${snapshot.asFound.result}`,
                  "",
                  "-- After the documented fix",
                  "select using (",
                  `  ${snapshot.afterFix.predicate}`,
                  ");",
                  `  ${snapshot.afterFix.result}`,
                ],
              },
            ]}
            /*
             * A compact provenance line, not the full note. The complete
             * statement travels with the evidence itself — in every scenario
             * panel and in the report's provenance card — and reproducing all
             * of it in the hero would outweigh the snapshot it qualifies. What
             * cannot be dropped is that this is a replay of a recording rather
             * than a live query, and that is stated here in full.
             */
            caption="Recorded from an isolated local PostgreSQL fixture and replayed here. The published application holds no database connection and runs no query. Full provenance travels with the report and each scenario."
          />
        </div>
      ) : null}

      <ul className="border-inverse/15 tablet:flex-row tablet:gap-8 mt-6 flex flex-col gap-2 border-t pt-5">
        <li className="text-body-sm text-inverse/70">
          Documented synthetic scope
        </li>
        <li className="text-body-sm text-inverse/70">Scenario evidence only</li>
      </ul>
    </div>
  );
}
