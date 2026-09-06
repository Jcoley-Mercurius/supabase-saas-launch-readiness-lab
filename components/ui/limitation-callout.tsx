import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";

/*
 * Limitation callout — MDS DESIGN-SYSTEM.md §10.
 *
 * It sits visually adjacent to the claim it qualifies and uses neutral,
 * informational styling. It is never demoted to low-contrast footer fine print
 * (mds/specification/DO-DONT.md).
 */
export function LimitationCallout({
  title = "Scope and limitation",
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Alert tone="info" title={title} className={className}>
      {children}
    </Alert>
  );
}
