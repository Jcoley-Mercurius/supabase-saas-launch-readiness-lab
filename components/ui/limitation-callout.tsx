import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";

/*
 * Limitation callout — MDS DESIGN-SYSTEM.md §10.
 *
 * It sits visually adjacent to the claim it qualifies and uses neutral,
 * informational styling. It is never demoted to low-contrast footer fine print
 * (mds/specification/DO-DONT.md).
 */
/**
 * The scenario-page limitation callout, addressed by
 * components/measurement/record-in-view. Only one scenario limitation exists
 * per page, so a stable id is safe.
 */
export const SCENARIO_LIMITATION_ID = "scenario-limitation";

export function LimitationCallout({
  title = "Scope and limitation",
  children,
  id,
  className,
}: {
  title?: string;
  children: ReactNode;
  /** Addresses the callout without wrapping it; no visual effect. */
  id?: string;
  className?: string;
}) {
  return (
    <Alert tone="info" title={title} id={id} className={className}>
      {children}
    </Alert>
  );
}
