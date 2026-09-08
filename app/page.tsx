import type { Metadata } from "next";
import {
  Container,
  Section,
  SectionEyebrow,
} from "@/components/layout/container";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { BoundaryNotes } from "@/components/layout/boundary-notes";
import { EvidenceSnapshot } from "@/components/report/evidence-snapshot";
import { ReportPreview } from "@/components/report/report-preview";
import { ProofSteps } from "@/components/scenarios/proof-steps";
import { ScenarioCard } from "@/components/scenarios/scenario-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import { SCENARIOS } from "@/lib/content/scenarios";
import { buildReportModel } from "@/lib/evidence/report";
import { PRODUCT, RISK_PILLARS } from "@/lib/content/site";

/*
 * Landing page — MDS COMPOSITION-PROPOSAL "Landing page shell", MDS-REF-002,
 * MDS-REF-009 panel 1.
 *
 * Product trace: MPS-REQ-001 (purpose, buyer, risk areas, limitations),
 * MPS-REQ-002 (synthetic context), MPS-REQ-009 (route to report and CTA),
 * MPS-REQ-014 (authorization boundary); MPS-ACC-001 and MPS-ACC-010.
 *
 * The hero evidence snapshot and the report preview's severity table and RLS
 * matrix excerpt were deferred in S1 (MTS-DEV-001) because no finding model
 * existed and fabricating one would have breached MPS-RULE-007. S4 populates
 * both from the derived report model, so every count, severity, state, and
 * policy excerpt on this page is read from the committed transcripts and
 * matches the report exactly.
 *
 * The synthetic SaaS context panel that stood in for the hero snapshot keeps
 * its canonical home on the scenario index (MDS-REF-005, MPS-ACC-002).
 */

export const metadata: Metadata = {
  title: "Supabase launch-readiness evidence, before you launch",
  description: PRODUCT.description,
};

export default function LandingPage() {
  const model = buildReportModel();

  return (
    <>
      <Section tone="ink" className="desktop:py-20 py-14">
        <Container>
          <div className="desktop:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] desktop:gap-12 grid grid-cols-1 items-start gap-10">
            <div>
              <p className="text-label text-inverse/70 uppercase">
                {PRODUCT.eyebrow}
              </p>
              <h1 className="text-display text-inverse mt-5">
                Supabase SaaS{" "}
                <span className="text-accent">Launch-Readiness Lab</span>
              </h1>
              <p className="text-body-lg text-inverse/85 mt-6 max-w-[56ch]">
                {PRODUCT.description}
              </p>

              <div className="mt-8">
                <BoundaryNotes tone="inverse" />
              </div>

              <div className="tablet:flex-row mt-8 flex flex-col gap-3">
                <ButtonLink href="/scenarios" size="lg" trailingArrow>
                  Explore the lab
                </ButtonLink>
                <ButtonLink href="/report" variant="inverse" size="lg">
                  View sample report
                </ButtonLink>
              </div>
            </div>

            <EvidenceSnapshot model={model} />
          </div>
        </Container>
      </Section>

      <Section tone="canvas" aria-labelledby="risk-pillars">
        <Container>
          <SectionEyebrow>Focus areas</SectionEyebrow>
          <h2 id="risk-pillars" className="text-h2 text-strong mt-3">
            Four risk pillars, end to end
          </h2>
          <p className="text-body-lg text-subtle mt-3 max-w-[64ch]">
            The lab covers the areas that most often block a Supabase SaaS
            launch. Each pillar has a documented scenario with reproducible
            evidence.
          </p>

          <ul className="tablet:grid-cols-2 wide:grid-cols-4 mt-10 grid grid-cols-1 gap-6">
            {RISK_PILLARS.map((pillar) => (
              <Card as="li" key={pillar.title} className="flex flex-col p-6">
                <span className="text-primary">
                  <Icon name={pillar.icon} size={24} />
                </span>
                <h3 className="text-h4 text-strong mt-4">{pillar.title}</h3>
                <p className="text-body-sm text-subtle mt-2">{pillar.body}</p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="base" aria-labelledby="how-the-proof-works">
        <Container>
          <div className="desktop:grid-cols-[minmax(0,290px)_minmax(0,1fr)] desktop:gap-12 grid grid-cols-1 gap-10">
            <div>
              <SectionEyebrow>How the proof works</SectionEyebrow>
              <h2 id="how-the-proof-works" className="text-h2 text-strong mt-3">
                One documented sequence, every scenario
              </h2>
              <p className="text-body-lg text-subtle mt-3">
                Every scenario follows the same five steps, so a result can be
                read the same way each time.
              </p>
              <ButtonLink
                href="/method"
                variant="secondary"
                className="mt-6"
                trailingArrow
              >
                Read the method
              </ButtonLink>
            </div>
            <ProofSteps />
          </div>
        </Container>
      </Section>

      <Section tone="canvas" aria-labelledby="scenario-preview">
        <Container>
          <div className="tablet:flex-row tablet:items-end tablet:justify-between flex flex-col gap-4">
            <div>
              <SectionEyebrow>Scenarios</SectionEyebrow>
              <h2 id="scenario-preview" className="text-h2 text-strong mt-3">
                Four scenarios, a clearer path to launch
              </h2>
              <p className="text-body-lg text-subtle mt-3 max-w-[64ch]">
                Each scenario includes a documented test, reproducible evidence,
                and practical fixes.
              </p>
            </div>
            <ButtonLink href="/scenarios" variant="quiet" trailingArrow>
              View all scenarios
            </ButtonLink>
          </div>

          <ul className="tablet:grid-cols-2 wide:grid-cols-4 tablet:grid-rows-[repeat(8,auto)] mt-10 grid grid-cols-1 gap-6">
            {SCENARIOS.map((scenario) => (
              <ScenarioCard key={scenario.slug} scenario={scenario} />
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="base" aria-labelledby="sample-report">
        <Container>
          <div className="desktop:grid-cols-[minmax(0,290px)_minmax(0,1fr)] desktop:gap-12 grid grid-cols-1 gap-10">
            <div>
              <SectionEyebrow>Sample report preview</SectionEyebrow>
              <h2 id="sample-report" className="text-h2 text-strong mt-3">
                Clear findings, easy to act on
              </h2>
              <p className="text-body-lg text-subtle mt-3">
                Ranked by severity, with reproduction evidence, remediation
                direction, and the limitation on what each result proves. The
                report is reachable without running a single scenario.
              </p>
              <ButtonLink
                href="/report"
                variant="secondary"
                className="mt-6"
                trailingArrow
              >
                View sample report
              </ButtonLink>
            </div>
            <ReportPreview model={model} />
          </div>
        </Container>
      </Section>

      <Section tone="canvas" aria-labelledby="service-boundary">
        <Container>
          <div className="max-w-[760px]">
            <SectionEyebrow>Service boundary</SectionEyebrow>
            <h2 id="service-boundary" className="text-h2 text-strong mt-3">
              What this lab is, and what it is not
            </h2>
            <p className="text-body-lg text-subtle mt-4">
              This is a launch-readiness review and remediation service, shown
              through documented synthetic scenarios. It demonstrates how the
              work is done and what the evidence looks like.
            </p>
            <LimitationCallout className="mt-6">
              <p>
                Every demonstration runs on synthetic data in an isolated
                environment. It is not a certification, a compliance
                attestation, a legal opinion, or a formal penetration test, and
                it makes no claim about any system other than the documented
                scenario. A demonstration here never authorizes testing of a
                third-party system.
              </p>
            </LimitationCallout>
            <ButtonLink
              href="/about"
              variant="secondary"
              className="mt-6"
              trailingArrow
            >
              About the service
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <AuthorizedReviewBand />
    </>
  );
}
