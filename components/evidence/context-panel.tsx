import { CodeExcerpt } from "@/components/evidence/code-excerpt";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { EvidenceScenario } from "@/lib/evidence/catalog";
import type { RecordedPolicy, RecordedRelation } from "@/lib/evidence/types";

/*
 * Scenario context panel (MDS COMPOSITION-PROPOSAL "Guided lab shell" —
 * optional 280-320px context panel for affected boundary, severity, and
 * persistent limitation; MDS-REF-006 right column).
 *
 * Below desktop the panel moves beneath the scenario heading and before the
 * primary proof, which the page layout handles by ordering.
 *
 * The policy excerpt is not written by hand. It is the policy text PostgreSQL
 * reported for the current documented mode, so it can never drift from the
 * policy the evidence was produced under.
 */

function policyLines(relation: RecordedRelation | undefined): string[] {
  if (!relation) {
    return ["-- No policy snapshot was recorded for this resource."];
  }
  if (relation.policies.length === 0) {
    return [
      `-- ${relation.resource}`,
      relation.row_security
        ? "-- Row level security is enabled but no policy is defined."
        : "-- Row level security is NOT enabled on this table.",
      "-- With no policy consulted, every granted row is returned.",
    ];
  }

  return relation.policies.flatMap((policy: RecordedPolicy) => [
    `create policy ${policy.name}`,
    `  on ${relation.resource}`,
    `  for ${policy.command}`,
    ...(policy.using ? [`  using (${policy.using})`] : []),
    ...(policy.with_check ? [`  with check (${policy.with_check})`] : []),
    ";",
  ]);
}

export function ContextPanel({
  scenario,
  relation,
  modeLabel,
}: {
  scenario: EvidenceScenario;
  relation: RecordedRelation | undefined;
  modeLabel: string;
}) {
  return (
    <Card tone="muted" className="flex min-w-0 flex-col gap-5 p-5">
      <div>
        <h2 className="text-h4 text-strong">Scenario context</h2>
        <p className="text-body-sm text-subtle mt-1">
          Key details for this scenario.
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="text-label text-subtle">Target resource</h3>
        <p className="border-line bg-base text-body-sm text-strong rounded-small mt-2 border px-3 py-2 font-mono break-all">
          {scenario.targetResource}
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="text-label text-subtle">Tenant boundary</h3>
        <p className="border-line bg-base text-body-sm text-strong rounded-small mt-2 border px-3 py-2 font-mono break-all">
          {scenario.tenantBoundary}
        </p>
        <p className="text-body-sm text-subtle mt-2">
          {scenario.tenantBoundaryNote}
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="text-label text-subtle">
          Policy in effect — {modeLabel}
        </h3>
        <div className="mt-2">
          <CodeExcerpt
            tabs={[
              {
                id: "policy",
                label: "Policy",
                description: `The row level security policies PostgreSQL reported on ${scenario.policyResource} in the ${modeLabel} mode.`,
                lines: policyLines(relation),
              },
            ]}
            caption={`Read from the recorded catalog snapshot for ${scenario.policyResource}. Not a hand-written example.`}
          />
        </div>
      </div>

      <Alert tone="info" title="Scenario limitation">
        <p>{scenario.limitation}</p>
      </Alert>
    </Card>
  );
}
