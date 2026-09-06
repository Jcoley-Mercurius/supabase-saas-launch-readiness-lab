import type { Metadata } from "next";
import {
  Container,
  Section,
  SectionEyebrow,
} from "@/components/layout/container";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { ProofSteps } from "@/components/scenarios/proof-steps";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import {
  StatusIndicator,
  type EvidenceState,
} from "@/components/ui/status-indicator";

/*
 * Method — the approved "How the proof works" narrative given its own route so
 * the global navigation is complete (MDS COMPOSITION-PROPOSAL, landing shell
 * section 3 and global navigation).
 *
 * Product trace: MPS-REQ-001 (how the proof works and its limitations),
 * MPS-REQ-008 (what a finding must carry), MPS-RULE-002 (states stay distinct).
 *
 * The evidence-state reference below is documentation of the vocabulary, not a
 * result: none of these states describes a test that has been run.
 */

export const metadata: Metadata = {
  title: "Method",
  description:
    "How each documented scenario runs: context, vulnerable proof, remediation, repeated test, and limitation — with the exact evidence states used to report a result.",
};

const STATE_REFERENCE: ReadonlyArray<{
  state: EvidenceState;
  explanation: string;
}> = [
  {
    state: "vulnerable",
    explanation:
      "The documented negative test exposed the representative boundary failure.",
  },
  {
    state: "remediated",
    explanation:
      "The repeated documented test was constrained as expected. This applies to the documented scenario only.",
  },
  {
    state: "untested",
    explanation: "No result exists. An untested check is never a pass.",
  },
  {
    state: "not-applicable",
    explanation:
      "The check does not apply to this resource, and the reason is stated with it.",
  },
  {
    state: "running",
    explanation:
      "A documented test is executing. The previous result is not silently replaced.",
  },
  {
    state: "unavailable",
    explanation:
      "No current proof could be retrieved. Recovery or an alternate route is offered instead.",
  },
  {
    state: "warning",
    explanation: "The result needs qualification and is not a pass or fail.",
  },
];

export default function MethodPage() {
  return (
    <>
      <Section tone="canvas" spacing="compact">
        <Container>
          <div className="max-w-[760px]">
            <SectionEyebrow>Method</SectionEyebrow>
            <h1 className="text-h1 text-strong mt-3">
              A documented, repeatable sequence
            </h1>
            <p className="text-body-lg text-subtle mt-4">
              Every scenario in the lab follows the same five steps against a
              synthetic multi-tenant SaaS. The sequence is what makes a result
              readable: you can see what was tested, what happened, what
              changed, and what the test does not cover.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="base" aria-labelledby="proof-sequence">
        <Container>
          <h2 id="proof-sequence" className="text-h2 text-strong">
            The five steps
          </h2>
          <div className="mt-8">
            <ProofSteps />
          </div>
        </Container>
      </Section>

      <Section tone="canvas" aria-labelledby="evidence-states">
        <Container>
          <h2 id="evidence-states" className="text-h2 text-strong">
            How a result is reported
          </h2>
          <p className="text-body-lg text-subtle mt-3 max-w-[64ch]">
            Each state below carries an icon, an exact label, an explanation,
            and a colour. The meaning survives without colour, and a missing
            result never resembles a completed one.
          </p>

          <ul className="tablet:grid-cols-2 mt-8 grid grid-cols-1 gap-4">
            {STATE_REFERENCE.map((item) => (
              <Card as="li" key={item.state} className="p-5">
                <StatusIndicator
                  state={item.state}
                  explanation={item.explanation}
                />
              </Card>
            ))}
          </ul>

          <LimitationCallout className="mt-8">
            <p>
              A remediated result applies only to the documented synthetic
              scenario that produced it. It is not a statement about any other
              system, and it is not a certification, a compliance attestation,
              or a formal penetration test.
            </p>
          </LimitationCallout>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/scenarios" trailingArrow>
              Explore the scenarios
            </ButtonLink>
            <ButtonLink href="/about" variant="secondary">
              About the service
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <AuthorizedReviewBand />
    </>
  );
}
