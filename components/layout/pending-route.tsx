import type { ReactNode } from "react";
import { Container, Section } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";

/*
 * Build-state notice for a route whose content is owned by a later slice.
 *
 * The approved navigation must always reach the scenarios, the sample report,
 * and the authorized-review CTA — "Never hide evidence state, limitation,
 * recovery action, or primary CTA" (MDS responsive.rules.visibility). So the
 * routes exist from S1 and say plainly what is and is not published yet, with a
 * recovery route out.
 *
 * This is a delivery-state message, not an evidence result. It deliberately
 * avoids the "Evidence unavailable" vocabulary, which describes a documented
 * test whose proof could not be retrieved. Here no test has been run at all, so
 * the honest state is the canonical `untested` one (MPS-RULE-002,
 * MPS-ACC-005: no missing check may be implied to have passed).
 */
export function PendingRoute({
  eyebrow,
  title,
  description,
  publishedBy,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Plain-language statement of which slice publishes this content. */
  publishedBy: string;
  children?: ReactNode;
}) {
  return (
    <Section tone="canvas">
      <Container width="reading">
        <p className="text-label text-subtle uppercase">{eyebrow}</p>
        <h1 className="text-h1 text-strong mt-3">{title}</h1>
        <p className="text-body-lg text-subtle mt-4">{description}</p>

        <Card className="mt-8 flex flex-col gap-5 p-6">
          <StatusIndicator
            state="untested"
            variant="block"
            explanation="No documented test has been run for this route. Nothing on this page reports a result, and no check should be read as passing."
          />
          <Alert tone="info" title="Not published in this build">
            <p>{publishedBy}</p>
          </Alert>
          {children}
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/scenarios" variant="secondary" trailingArrow>
              Browse the scenarios
            </ButtonLink>
            <ButtonLink href="/method" variant="quiet">
              Read how the proof works
            </ButtonLink>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
