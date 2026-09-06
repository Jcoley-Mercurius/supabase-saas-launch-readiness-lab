import { Container, Section } from "@/components/layout/container";
import { LoadingState } from "@/components/ui/states";

/*
 * Shared route loading state (MDS patterns.loading; MDS-REF-003).
 *
 * It preserves the shell and page rhythm rather than collapsing the layout,
 * and it never implies that a documented test succeeded while it is shown.
 */
export default function Loading() {
  return (
    <Section tone="canvas">
      <Container width="reading">
        <LoadingState
          title="Loading"
          description="Preparing this part of the lab. No documented test result is implied while this loads."
        />
      </Container>
    </Section>
  );
}
