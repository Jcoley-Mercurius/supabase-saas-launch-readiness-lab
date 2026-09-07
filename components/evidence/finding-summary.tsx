import { StateGlyph } from "@/components/ui/state-glyph";
import type { EvidenceScenario } from "@/lib/evidence/catalog";
import type { EvidenceState } from "@/components/ui/status-indicator";

/*
 * Finding summary band (MDS COMPONENTS-PROPOSAL "Finding summary"; MDS-REF-006
 * "Cross-tenant data exposure / High").
 *
 * Severity is stated with the basis for it, so the badge is an argument rather
 * than a label. The band is tinted by the current documented state, but the
 * state is never carried by tint alone: the glyph, the severity word, and the
 * explanatory text all say it too.
 */
export function FindingSummary({
  scenario,
  state,
}: {
  scenario: EvidenceScenario;
  state: EvidenceState;
}) {
  const resolved =
    state === "vulnerable"
      ? {
          surface: "border-vulnerable/35 bg-vulnerable/6",
          fg: "text-vulnerable",
          glyph: "exclamation-circle" as const,
        }
      : state === "remediated"
        ? {
            surface: "border-remediated/35 bg-remediated/6",
            fg: "text-remediated",
            glyph: "check-circle" as const,
          }
        : {
            surface: "border-line bg-canvas",
            fg: "text-untested",
            glyph: "ring-circle" as const,
          };

  return (
    <section
      aria-label="Finding summary"
      className={`rounded-card desktop:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] grid grid-cols-1 gap-5 border p-5 ${resolved.surface}`}
    >
      <div className="flex items-start gap-4">
        <span className={`mt-0.5 shrink-0 ${resolved.fg}`}>
          <StateGlyph shape={resolved.glyph} size={24} />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="text-h3 text-strong">{scenario.finding}</h3>
            <span
              className={`text-label rounded-pill border px-2.5 py-1 ${resolved.fg} border-current`}
            >
              {scenario.severity} severity
            </span>
          </div>
          <p className="text-body text-subtle mt-2">{scenario.impact}</p>
          <p className="text-body-sm text-subtle mt-2">
            <span className="text-strong font-semibold">
              Why this severity.{" "}
            </span>
            {scenario.severityBasis}
          </p>
        </div>
      </div>

      <dl className="text-body-sm flex flex-col gap-3">
        <div>
          <dt className="text-subtle font-semibold">Affected area</dt>
          <dd className="text-strong mt-0.5">{scenario.affectedArea}</dd>
        </div>
        <div>
          <dt className="text-subtle font-semibold">Tenant boundary</dt>
          <dd className="text-strong mt-0.5 font-mono">
            {scenario.tenantBoundary}
          </dd>
        </div>
      </dl>
    </section>
  );
}
