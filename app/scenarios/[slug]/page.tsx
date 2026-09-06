import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { Container, Section } from "@/components/layout/container";
import { GuidedLab } from "@/components/evidence/guided-lab";
import { ScenarioRail } from "@/components/evidence/scenario-navigation";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { PROOF_STEPS, BOUNDARY_NOTES } from "@/lib/content/site";
import { SCENARIOS, getScenario } from "@/lib/content/scenarios";
import { EVIDENCE_SCENARIOS } from "@/lib/evidence/catalog";
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
 * S2 publishes the two scenarios whose evidence exists: authorization/RLS and
 * storage/configuration. The webhook and reliability scenarios keep the honest
 * untested build-state notice until S3 records their evidence — a route that
 * cannot yet prove anything must not look like one that can.
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

function hasPublishedEvidence(slug: string): slug is EvidenceScenarioId {
  return (EVIDENCE_SCENARIO_IDS as readonly string[]).includes(slug);
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

  // Bound to a local so the type guard narrows for the JSX below.
  const scenarioSlug = scenario.slug;
  const published = hasPublishedEvidence(scenarioSlug);

  return (
    <>
      <Section tone="canvas" spacing="compact">
        <Container width="evidence">
          <nav aria-label="Breadcrumb">
            <ol className="text-body-sm text-subtle flex items-center gap-2">
              <li>
                <Link
                  href="/scenarios"
                  className="hover:text-strong inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  Scenarios
                </Link>
              </li>
              <li
                aria-hidden="true"
                className="text-untested flex items-center"
              >
                <Icon name="chevron-right" size={16} />
              </li>
              <li className="text-strong" aria-current="page">
                {scenario.pillar}
              </li>
            </ol>
          </nav>

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

              {published ? (
                <GuidedLab
                  scenario={EVIDENCE_SCENARIOS[scenarioSlug]}
                  scenarioTitle={scenario.pillar}
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
                    state="untested"
                    variant="block"
                    explanation="No documented test has been run for this scenario in any build. An untested check is not a pass."
                  />

                  <Alert tone="info" title="Guided lab not published yet">
                    <p>
                      This scenario&rsquo;s evidence is recorded in a later
                      build stage. Its identity, documented test, and evidence
                      state are shown here so nothing is implied about a result
                      that does not exist. The authorization and storage
                      scenarios are published and can be run now.
                    </p>
                  </Alert>

                  <ol className="border-line flex flex-col gap-4 border-t pt-5">
                    {PROOF_STEPS.map((step, index) => (
                      <li key={step.title} className="flex items-start gap-3">
                        <span className="border-line text-label text-subtle bg-base rounded-pill flex size-7 shrink-0 items-center justify-center border">
                          {index + 1}
                        </span>
                        <span className="flex flex-col">
                          <span className="text-body-sm text-strong font-semibold">
                            {step.title}
                          </span>
                          <span className="text-body-sm text-subtle">
                            {step.body}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>

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
