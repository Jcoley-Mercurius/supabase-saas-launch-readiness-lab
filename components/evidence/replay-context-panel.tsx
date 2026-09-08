import { CodeExcerpt } from "@/components/evidence/code-excerpt";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { ReplayScenario } from "@/lib/evidence/replay-catalog";
import type { HandlerSnapshot } from "@/lib/evidence/replay-types";

/*
 * Replay scenario context panel (MDS COMPOSITION-PROPOSAL "Guided lab shell" —
 * optional 280-320px context panel for affected boundary, severity, and
 * persistent limitation; MDS-REF-006 right column).
 *
 * Below desktop the panel moves beneath the scenario heading and before the
 * primary proof, which the page layout handles by ordering.
 *
 * The configuration excerpt is not written by hand. It is the configuration
 * row the handler actually branched on, read back from the database, so it
 * can never drift from the handler the evidence was produced under — the same
 * rule the S2 policy excerpt follows.
 */

function configurationLines(handler: HandlerSnapshot | undefined): string[] {
  if (!handler) {
    return ["-- No handler configuration was recorded for this run."];
  }

  const c = handler.configuration;
  return [
    `-- ${c.mode} handler configuration`,
    "",
    `verify_signature = ${c.verify_signature}`,
    `ledger_key       = ${c.ledger_key}`,
    `enforce_order    = ${c.enforce_order}`,
    `atomic_commit    = ${c.atomic_commit}`,
    "",
    `-- ${handler.ledger_constraint}`,
  ];
}

export function ReplayContextPanel({
  scenario,
  handler,
  modeLabel,
}: {
  scenario: ReplayScenario;
  handler: HandlerSnapshot | undefined;
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
        <h3 className="text-label text-subtle">Surface under test</h3>
        <p className="border-line bg-base text-body-sm text-strong rounded-small mt-2 border px-3 py-2 font-mono break-all">
          {scenario.targetResource}
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="text-label text-subtle">Boundary</h3>
        <p className="border-line bg-base text-body-sm text-strong rounded-small mt-2 border px-3 py-2 font-mono break-all">
          {scenario.boundary}
        </p>
        <p className="text-body-sm text-subtle mt-2">{scenario.boundaryNote}</p>
      </div>

      <div className="min-w-0">
        <h3 className="text-label text-subtle">
          Handler configuration — {modeLabel}
        </h3>
        <div className="mt-2">
          <CodeExcerpt
            tabs={[
              {
                id: "configuration",
                label: "Configuration",
                description: `The four facts the webhook handler branched on in the ${modeLabel}.`,
                lines: configurationLines(handler),
              },
            ]}
            caption="Read back from the database after the run. Not a hand-written example."
          />
        </div>
      </div>

      <Alert tone="info" title="Scenario limitation">
        <p>{scenario.limitation}</p>
      </Alert>
    </Card>
  );
}
