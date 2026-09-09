import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Container, Section } from "@/components/layout/container";
import { GuidedLab } from "@/components/evidence/guided-lab";
import { ReplayLab } from "@/components/evidence/replay-lab";
import { ScenarioRail } from "@/components/evidence/scenario-navigation";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { BOUNDARY_NOTES } from "@/lib/content/site";
import { SCENARIOS, getScenario } from "@/lib/content/scenarios";
import { EVIDENCE_SCENARIOS } from "@/lib/evidence/catalog";
import { REPLAY_SCENARIOS } from "@/lib/evidence/replay-catalog";
import {
  REPLAY_SCENARIO_IDS,
  type ReplayScenarioId,
} from "@/lib/evidence/replay-types";
import {
  EVIDENCE_SCENARIO_IDS,
  type EvidenceScenarioId,
} from "@/lib/evidence/types";

/*
 * Guided lab route.
 *
 * Trace: MPS-REQ-002/003/004/005/009/012, MPS-RULE-002/003/007,
 *        MPS-ACC-003/004/005/006/014;
 *        MDS COMPOSITION-PROPOSAL "Guided lab shell" and "Scenario detail
 *        hierarchy"; MDS-REF-006, MDS-REF-009 panel 3.
 *
 * S2 published authorization/RLS and storage/configuration; S3 publishes
 * webhook integrity and reliability/recovery. All four approved scenarios now
 * have recorded evidence, and each route renders the lab that reads the
 * transcript for its own slice.
 *
 * The final branch is not dead code kept for tidiness. A scenario that is
 * published in lib/content/scenarios.ts but belongs to neither evidence
 * allowlist would otherwise render a heading with nothing under it; instead it
 * renders the canonical unavailable state, so a future scenario added without
 * its evidence announces that fact rather than looking like a finished route
 * with no findings (MPS-RULE-002, MPS-ACC-014).
 */

/*
 * Only the four approved scenario identifiers resolve.
 *
 * With the default (dynamicParams: true), an unknown slug is rendered on
 * demand: notFound() then produces the 404 body but the response still
 * carries HTTP 200, which is both misleading to a crawler and a weaker
 * boundary than it looks. Setting this to false means Next serves only the
 * paths generateStaticParams produced, and every other identifier is a real
 * 404 (MPS-REQ-013: public input selects approved identifiers only).
 */
export const dynamicParams = false;

function hasAuthorizationEvidence(slug: string): slug is EvidenceScenarioId {
  return (EVIDENCE_SCENARIO_IDS as readonly string[]).includes(slug);
}

function hasReplayEvidence(slug: string): slug is ReplayScenarioId {
  return (REPLAY_SCENARIO_IDS as readonly string[]).includes(slug);
}

export function generateStaticParams() {
  return SCENARIOS.map((scenario) => ({ slug: scenario.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/scenarios/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const scenario = getScenario(slug);
  if (!scenario) return {};

  return {
    title: scenario.pillar,
    description: scenario.summary,
  };
}

export default async function ScenarioPage({
  params,
}: PageProps<"/scenarios/[slug]">) {
  const { slug } = await params;
  const scenario = getScenario(slug);

  if (!scenario) {
    notFound();
  }

  // Bound to a local so the type guards narrow for the JSX below.
  const scenarioSlug = scenario.slug;

  return (
    <>
      <Section tone="canvas" spacing="compact">
        <Container width="evidence">
          <Breadcrumb
            trail={[
              { label: "Scenarios", href: "/scenarios" },
              { label: scenario.pillar },
            ]}
          />

          {/*
           * The approved wide lab shell: 240-264px scenario rail, flexible
           * evidence canvas. Below 960px the rail becomes the in-flow selector
           * that ScenarioRail renders, and it stays above the canvas in the
           * reading order.
           */}
          <div className="desktop:grid-cols-[248px_minmax(0,1fr)] mt-6 grid min-w-0 grid-cols-1 gap-8">
            <ScenarioRail currentSlug={scenario.slug} />

            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex items-start gap-4">
                <span className="text-primary mt-1 shrink-0">
                  <Icon name={scenario.icon} size={24} />
                </span>
                <div>
                  <h1 className="text-h1 text-strong">{scenario.pillar}</h1>
                  <p className="text-body-lg text-subtle mt-3 max-w-[64ch]">
                    {scenario.summary}
                  </p>
                </div>
              </div>

              {/*
               * The service boundary sits beside the proof, not only in the
               * footer (MPS-REQ-001, MPS-REQ-014).
               */}
              <ul className="border-line text-body-sm text-subtle flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-3">
                {BOUNDARY_NOTES.map((note) => (
                  <li key={note.label} className="flex items-center gap-2">
                    <span className="text-untested shrink-0">
                      <Icon name={note.icon} size={16} />
                    </span>
                    {note.label}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <span className="text-untested shrink-0">
                    <Icon name="file-check" size={16} />
                  </span>
                  Documented synthetic scope
                </li>
              </ul>

              {hasAuthorizationEvidence(scenarioSlug) ? (
                <GuidedLab
                  scenario={EVIDENCE_SCENARIOS[scenarioSlug]}
                  scenarioTitle={scenario.pillar}
                  documentedTest={scenario.documentedTest}
                />
              ) : hasReplayEvidence(scenarioSlug) ? (
                <ReplayLab
                  scenario={REPLAY_SCENARIOS[scenarioSlug]}
                  documentedTest={scenario.documentedTest}
                />
              ) : (
                <Card className="flex flex-col gap-5 p-6">
                  <div>
                    <h2 className="text-h4 text-strong">
                      Documented test (negative case)
                    </h2>
                    <p className="text-body text-subtle mt-2">
                      {scenario.documentedTest}
                    </p>
                  </div>

                  <StatusIndicator
                    state="unavailable"
                    variant="block"
                    explanation="No recorded evidence exists for this scenario in this build. Nothing here should be read as a result, and an absent check is not a pass."
                  />

                  <Alert tone="warning" title="This is not a result">
                    <p>
                      This scenario&rsquo;s identity and documented test are
                      shown so nothing is implied about a result that does not
                      exist. The published scenarios can be run now.
                    </p>
                  </Alert>

                  <div className="flex flex-wrap gap-3">
                    <ButtonLink
                      href="/scenarios/authorization-and-rls"
                      variant="secondary"
                      trailingArrow
                    >
                      Open a published scenario
                    </ButtonLink>
                    <ButtonLink href="/report" variant="quiet" trailingArrow>
                      View sample report
                    </ButtonLink>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <AuthorizedReviewBand />
    </>
  );
}
