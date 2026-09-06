import type { Metadata } from "next";
import {
  Container,
  Section,
  SectionEyebrow,
} from "@/components/layout/container";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { BoundaryNotes } from "@/components/layout/boundary-notes";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import { Icon } from "@/components/ui/icon";
import { RISK_PILLARS } from "@/lib/content/site";

/*
 * About the service — the approved service-boundary section given its own
 * route so the global navigation is complete (MDS COMPOSITION-PROPOSAL,
 * landing shell section 6 and global navigation).
 *
 * Product trace: MPS-REQ-001, MPS-REQ-013 (no credentials, customer data, or
 * uploads), MPS-REQ-014 (live work requires documented authorization),
 * MPS-RULE-003, MPS-RULE-005, MPS-RULE-007, MPS-RULE-008 (retention).
 */

export const metadata: Metadata = {
  title: "About the service",
  description:
    "What the Supabase SaaS Launch-Readiness Lab is, who it is for, what it deliberately does not do, and the authorization boundary that applies to any work on a live system.",
};

const NOT_INCLUDED = [
  "Certification, compliance attestation, or a legal opinion.",
  "A formal penetration test or an unauthorized test of any live system.",
  "Live scanning of a buyer's application, or any buyer file upload.",
  "Production credentials, secrets, or real customer records.",
  "An automated score claiming that an application is ready to launch.",
];

export default function AboutPage() {
  return (
    <>
      <Section tone="canvas" spacing="compact">
        <Container width="reading">
          <SectionEyebrow>About the service</SectionEyebrow>
          <h1 className="text-h1 text-strong mt-3">
            A launch-readiness review, shown rather than claimed
          </h1>
          <p className="text-body-lg text-subtle mt-4">
            The lab is a public portfolio experience. It demonstrates how a
            Supabase SaaS launch-readiness review is carried out — the
            documented tests, the evidence they produce, the fixes, and the
            limits of what any single test proves.
          </p>
          <div className="mt-6">
            <BoundaryNotes />
          </div>
        </Container>
      </Section>

      <Section tone="base" aria-labelledby="who-its-for">
        <Container width="reading">
          <h2 id="who-its-for" className="text-h2 text-strong">
            Who it is for
          </h2>
          <ul className="text-body text-subtle mt-4 flex list-disc flex-col gap-2 pl-5">
            <li>
              SaaS founders and product owners preparing to launch or onboard
              paying users.
            </li>
            <li>
              Agencies and development teams responsible for client delivery.
            </li>
            <li>
              Portfolio reviewers judging relevance and depth before starting a
              conversation.
            </li>
          </ul>

          <h2 className="text-h2 text-strong mt-12">What a review covers</h2>
          <ul className="tablet:grid-cols-2 mt-4 grid grid-cols-1 gap-4">
            {RISK_PILLARS.map((pillar) => (
              <Card as="li" key={pillar.title} className="p-5">
                <span className="text-primary">
                  <Icon name={pillar.icon} size={20} />
                </span>
                <h3 className="text-h4 text-strong mt-3">{pillar.title}</h3>
                <p className="text-body-sm text-subtle mt-1">{pillar.body}</p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="canvas" aria-labelledby="limitations">
        <Container width="reading">
          {/* Footer "Limitations" link target. */}
          <h2 id="limitations" className="text-h2 text-strong scroll-mt-24">
            Limitations and boundaries
          </h2>
          <p className="text-body-lg text-subtle mt-3">
            These limits are part of the service, not fine print. They apply to
            everything published in this lab.
          </p>

          <h3 className="text-h4 text-strong mt-8">What this is not</h3>
          <ul className="text-body text-subtle mt-3 flex list-disc flex-col gap-2 pl-5">
            {NOT_INCLUDED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <LimitationCallout title="Synthetic scope" className="mt-8">
            <p>
              Every scenario runs on synthetic data in an isolated environment.
              A result describes only the documented scenario that produced it.
              Nothing in this lab describes the state of any other application.
            </p>
          </LimitationCallout>

          <LimitationCallout title="Authorization boundary" className="mt-4">
            <p>
              A demonstration here never authorizes testing of a third-party
              system. Any work against a live system begins only after
              authorization, scope, and data handling are documented and
              confirmed separately.
            </p>
          </LimitationCallout>

          <LimitationCallout
            title="Inquiries and your information"
            className="mt-4"
          >
            <p>
              An inquiry asks for high-level context only. It never asks for
              credentials, secrets, production data, or file uploads.
              Acknowledging an inquiry confirms that it arrived; it is not an
              engagement acceptance and carries no timeline, price, or outcome.
              Inquiry content is kept for no more than 12 months after the
              latest activity, can be deleted earlier on request, and only
              minimal operational metadata may remain afterward where it is
              needed to avoid duplicate handling.
            </p>
          </LimitationCallout>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/method" variant="secondary" trailingArrow>
              Read the method
            </ButtonLink>
            <ButtonLink href="/scenarios" variant="quiet" trailingArrow>
              Explore the scenarios
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <AuthorizedReviewBand />
    </>
  );
}
