import type { Metadata } from "next";
import {
  Container,
  Section,
  SectionEyebrow,
} from "@/components/layout/container";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { BoundaryNotes } from "@/components/layout/boundary-notes";
import { ScenarioCard } from "@/components/scenarios/scenario-card";
import { SyntheticContextPanel } from "@/components/scenarios/synthetic-context-panel";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  SCENARIOS,
  RECOMMENDED_SCENARIO_SLUG,
  getScenario,
} from "@/lib/content/scenarios";

/*
 * Scenario index — MDS COMPOSITION-PROPOSAL "Scenario index shell",
 * MDS-REF-005, MDS-REF-009 panel 2.
 *
 * Product trace: MPS-REQ-002 (synthetic context), MPS-REQ-009 (report route
 * from anywhere), MPS-ACC-002, MPS-ACC-005 (no missing check implies a pass),
 * MPS-ACC-010 (report and CTA without completing scenarios).
 *
 * Progress language describes explored evidence only, never product security
 * coverage. Session progress tracking depends on the evidence engine, so S1
 * publishes the honest starting value with its limitation attached.
 */

export const metadata: Metadata = {
  title: "Scenarios",
  description:
    "Four documented scenarios covering authorization and RLS, storage and configuration, webhook integrity, and reliability and recovery in a synthetic multi-tenant SaaS.",
};

export default function ScenarioIndexPage() {
  const recommended = getScenario(RECOMMENDED_SCENARIO_SLUG);

  return (
    <>
      <Section tone="ink" className="desktop:py-20 py-14">
        <Container>
          <div className="desktop:grid-cols-2 desktop:gap-16 grid grid-cols-1 items-start gap-10">
            <div>
              <p className="text-label text-inverse/70 uppercase">
                Synthetic scenarios. Reproducible evidence. Authorized work
                only.
              </p>
              <h1 className="text-h1 text-inverse mt-5">
                Synthetic scenarios for SaaS builds
              </h1>
              <p className="text-body-lg text-inverse/85 mt-6 max-w-[56ch]">
                Explore documented tests in a synthetic multi-tenant SaaS
                application, with evidence that surfaces material risks and
                practical fixes before you launch.
              </p>

              <div className="mt-8">
                <BoundaryNotes tone="inverse" />
              </div>

              <div className="tablet:flex-row mt-8 flex flex-col gap-3">
                <ButtonLink href="/report" size="lg" trailingArrow>
                  View sample report
                </ButtonLink>
                <ButtonLink href="/method" variant="inverse" size="lg">
                  Learn about the method
                </ButtonLink>
              </div>
            </div>

            <SyntheticContextPanel />
          </div>
        </Container>
      </Section>

      <Section tone="canvas" aria-labelledby="scenario-index">
        <Container>
          <div className="desktop:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] desktop:gap-16 grid grid-cols-1 gap-8">
            <div>
              <SectionEyebrow>Scenario index</SectionEyebrow>
              <h2 id="scenario-index" className="text-h2 text-strong mt-3">
                Four scenarios, a clearer path to launch
              </h2>
              <p className="text-body-lg text-subtle mt-3">
                Each scenario includes a documented test, reproducible evidence,
                and practical fixes. Follow the recommended path or explore in
                any order.
              </p>
            </div>

            {/*
             * Exploration progress. The count describes evidence explored in
             * this session and is explicitly not a measure of security
             * coverage (MDS scenario-index shell; MPS-RULE-007).
             */}
            <div>
              <h3 className="text-body text-strong font-semibold">
                Your exploration progress
              </h3>
              <p className="text-body-sm text-subtle mt-1">
                Track the scenarios you have explored in this session.
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="bg-muted border-line rounded-pill h-2 grow overflow-hidden border"
                  role="img"
                  aria-label="0 of 4 scenarios explored in this session"
                >
                  <div className="bg-primary h-full w-0" />
                </div>
                <p className="text-body-sm text-subtle whitespace-nowrap">
                  0 of 4 explored
                </p>
              </div>
              <p className="text-body-sm text-subtle mt-3 flex items-start gap-2">
                <span className="text-info mt-0.5 shrink-0">
                  <Icon name="info" size={16} />
                </span>
                Evidence explored in this session. Not a measure of overall
                security.
              </p>
            </div>
          </div>

          {recommended ? (
            <Card
              tone="muted"
              className="tablet:flex-row tablet:items-center tablet:justify-between mt-10 flex flex-col gap-4 p-6"
            >
              <div className="flex items-start gap-4">
                <span className="text-primary mt-1 shrink-0">
                  <Icon name="route" size={24} />
                </span>
                <div>
                  <h3 className="text-h4 text-strong">
                    Recommended path (optional)
                  </h3>
                  <p className="text-body-sm text-subtle mt-1">
                    Start with {recommended.pillar}, then explore the remaining
                    scenarios in order. Any order works, and the sample report
                    is reachable without completing a scenario.
                  </p>
                </div>
              </div>
              <ButtonLink
                href={`/scenarios/${recommended.slug}`}
                variant="secondary"
                trailingArrow
              >
                Start the recommended path
              </ButtonLink>
            </Card>
          ) : null}

          <ul className="tablet:grid-cols-2 wide:grid-cols-4 tablet:grid-rows-[repeat(8,auto)] mt-8 grid grid-cols-1 gap-6">
            {SCENARIOS.map((scenario) => (
              <ScenarioCard key={scenario.slug} scenario={scenario} />
            ))}
          </ul>

          <Card className="desktop:flex-row desktop:items-center desktop:justify-between mt-8 flex flex-col gap-6 p-6">
            <div className="flex items-start gap-4">
              <span className="text-primary mt-1 shrink-0">
                <Icon name="file-text" size={24} />
              </span>
              <div>
                <h3 className="text-h4 text-strong">
                  See what a full report looks like
                </h3>
                <p className="text-body-sm text-subtle mt-1">
                  View a sample report with findings, evidence, and remediation
                  guidance.
                </p>
              </div>
            </div>
            <ButtonLink href="/report" variant="secondary" trailingArrow>
              View sample report
            </ButtonLink>
          </Card>
        </Container>
      </Section>

      <AuthorizedReviewBand />
    </>
  );
}
