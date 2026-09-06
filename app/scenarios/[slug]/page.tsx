import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { Container, Section } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { PROOF_STEPS } from "@/lib/content/site";
import { SCENARIOS, getScenario } from "@/lib/content/scenarios";

/*
 * Scenario entry route.
 *
 * S1 owns scenario identity, the breadcrumb/back path required on deep
 * scenario views (MDS COMPONENTS-PROPOSAL "Navigation and progress"), and the
 * honest starting evidence state. The guided lab itself — rail and selector,
 * interactive stepper, evidence panel, RLS matrix, before/after comparison,
 * recovery — is the shared lab framework in S2, and the executed evidence is
 * S2 (authorization, storage) and S3 (webhook, reliability).
 *
 * Nothing here reports a result. The state stays `untested` so no unrun check
 * can be read as passing (MPS-RULE-002, MPS-ACC-005).
 */

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

  return (
    <>
      <Section tone="canvas" spacing="compact">
        <Container>
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

          <div className="mt-6 flex items-start gap-4">
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

          <div className="desktop:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] mt-8 grid grid-cols-1 gap-6">
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
                explanation="No documented test has been run in this session. An untested check is not a pass."
              />

              <Alert tone="info" title="Guided lab not published yet">
                <p>
                  This scenario&rsquo;s guided lab, evidence panel, and
                  before/after comparison are published in a later build stage.
                  The scenario identity, its documented test, and its evidence
                  state are shown here so nothing is implied about a result that
                  does not exist.
                </p>
              </Alert>

              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/scenarios" variant="secondary" trailingArrow>
                  Back to all scenarios
                </ButtonLink>
                <ButtonLink href="/report" variant="quiet" trailingArrow>
                  View sample report
                </ButtonLink>
              </div>
            </Card>

            <Card tone="muted" className="p-6">
              <h2 className="text-h4 text-strong">
                What this scenario will show
              </h2>
              <ol className="mt-4 flex flex-col gap-4">
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
              <p className="text-body-sm text-subtle mt-5">{scenario.depth}</p>
            </Card>
          </div>
        </Container>
      </Section>

      <AuthorizedReviewBand />
    </>
  );
}
