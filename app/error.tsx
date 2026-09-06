"use client";

import { useEffect } from "react";
import { Container, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

/*
 * Shared route error boundary (MDS patterns.error; MPS-REQ-012, MPS-ACC-014).
 *
 * The failure is stated plainly, the buyer keeps a recovery action and an
 * alternate route, and the failure is never converted into a silent success.
 *
 * Next 16 names the recovery callback `retry` (not `reset`); see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md.
 */
export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // No secret, credential, or buyer value can reach this path: the S1 shell
    // renders static approved content only.
    console.error(error);
  }, [error]);

  return (
    <Section tone="canvas">
      <Container width="reading">
        <ErrorState description="This part of the lab could not be loaded. This is a loading failure, not a documented test result — no check should be read as passing or failing because of it.">
          <Button onClick={() => retry()}>Try again</Button>
        </ErrorState>
      </Container>
    </Section>
  );
}
