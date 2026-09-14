import { Container, Section } from "@/components/layout/container";
import { LoadingState } from "@/components/ui/states";

/*
 * Shared route loading state (MDS patterns.loading; MDS-REF-003).
 *
 * It preserves the shell and page rhythm rather than collapsing the layout,
 * and it never implies that a documented test succeeded while it is shown.
 *
 * min-h-svh reserves space for the page this fallback stands in for
 * (MDS-QA-R1-F002). This file is the Suspense boundary around every route, and
 * React outlines a large prerendered page: the served HTML carries this
 * fallback, then the shell footer, then the real page in a hidden node that an
 * inline script swaps in. Without a reserved height the first paint could pin
 * the sticky footer to the viewport bottom and the swap then pushed it down - a
 * 0.12 layout shift at desktop and 0.25 at mobile, on nearly every route.
 * Holding the fallback at least one viewport tall keeps the footer below the
 * fold until the page arrives, which is the approach the Next.js streaming
 * guide gives for CLS ("min-height containers around Suspense boundaries so
 * the space is reserved"). The footer itself is unchanged.
 */
export default function Loading() {
  return (
    <Section tone="canvas" className="min-h-svh">
      <Container width="reading">
        <LoadingState
          title="Loading"
          description="Preparing this part of the lab. No documented test result is implied while this loads."
        />
      </Container>
    </Section>
  );
}
