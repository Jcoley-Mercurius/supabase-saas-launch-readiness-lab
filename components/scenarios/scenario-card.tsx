import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  RECOMMENDED_SCENARIO_SLUG,
  type Scenario,
} from "@/lib/content/scenarios";

/*
 * Scenario card — MDS COMPONENTS-PROPOSAL "Scenario card": pillar, risk
 * statement, expected proof, current evidence state, exploration depth, and a
 * primary entry action. It never promises an execution time.
 *
 * Evidence state is the canonical `untested` state until a documented test has
 * actually been run in the session, which S2/S3 implement. Rendering anything
 * warmer here would imply a result that does not exist (MPS-RULE-002,
 * MPS-ACC-005; Gate 5 reconciliation of MDS-REF-005).
 */
export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const recommended = scenario.slug === RECOMMENDED_SCENARIO_SLUG;

  return (
    <Card
      as="li"
      interactive
      className="tablet:grid tablet:grid-rows-subgrid tablet:row-span-8 flex flex-col p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="border-line text-label text-subtle rounded-pill flex size-8 items-center justify-center border">
          {scenario.order}
        </span>
        {recommended ? <Badge tone="primary">Recommended</Badge> : null}
      </div>

      <span className="text-primary mt-6 block">
        <Icon name={scenario.icon} size={24} />
      </span>

      <h3 className="text-h4 text-strong mt-4">{scenario.pillar}</h3>
      <p className="text-body-sm text-subtle mt-2">{scenario.summary}</p>

      <div className="border-line bg-muted rounded-small mt-5 border p-3">
        <p className="text-label text-strong">
          Documented test (negative case)
        </p>
        <p className="text-body-sm text-subtle mt-1">
          {scenario.documentedTest}
        </p>
      </div>

      <StatusIndicator
        state="untested"
        className="mt-5"
        explanation="No documented test has been run in this session."
      />

      <p className="text-body-sm text-subtle mt-4">{scenario.depth}</p>

      <div className="mt-6 flex items-end">
        <ButtonLink
          href={`/scenarios/${scenario.slug}`}
          className="w-full"
          trailingArrow
        >
          <span>
            Explore scenario
            <span className="sr-only">: {scenario.pillar}</span>
          </span>
        </ButtonLink>
      </div>
    </Card>
  );
}
