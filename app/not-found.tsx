import { Container, Section } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

/** Shared 404 — preserves the shell and offers the approved routes back. */
export default function NotFound() {
  return (
    <Section tone="canvas">
      <Container width="reading">
        <EmptyState
          title="This page is not available"
          description="The address does not match a published route in the lab. The scenario index and the sample report are both reachable from here."
        >
          <ButtonLink href="/scenarios" trailingArrow>
            Browse the scenarios
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Return to the overview
          </ButtonLink>
        </EmptyState>
      </Container>
    </Section>
  );
}
