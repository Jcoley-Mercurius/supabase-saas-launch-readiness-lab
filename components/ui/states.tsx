import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { StateGlyph } from "@/components/ui/state-glyph";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

/*
 * Shared loading, empty, and error states (MDS COMPONENTS-PROPOSAL "Feedback
 * and recovery components"; MDS-REF-003 "Empty, loading, and error states").
 *
 * Governing rules applied here:
 *  - A loading treatment preserves layout and never implies a test succeeded.
 *  - An empty state explains why no evidence exists and what action is available.
 *  - A failure always offers recovery or an alternate route and is never
 *    silently converted into success (MPS-REQ-012, MPS-ACC-014).
 */

export function LoadingState({
  title = "Loading",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {/*
       * role="status" announces the change politely without moving focus
       * (MDS interaction: focus moves only after deliberate navigation).
       */}
      <div role="status" className="flex flex-col items-center gap-3">
        <Icon name="loader" size={24} className="text-subtle animate-spin" />
        <p className="text-h4 text-strong">{title}</p>
        {description ? (
          <p className="text-body-sm text-subtle">{description}</p>
        ) : null}
      </div>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Icon name="file-text" size={24} className="text-subtle" />
      <p className="text-h4 text-strong">{title}</p>
      <p className="text-body-sm text-subtle max-w-[46ch]">{description}</p>
      {children ? (
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      ) : null}
    </Card>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "This part of the lab could not be loaded. No documented test result is implied by this failure.",
  children,
}: {
  title?: string;
  description?: string;
  /** Recovery controls — a retry, a return route, or both. */
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <StateGlyph
        shape="exclamation-circle"
        size={24}
        className="text-vulnerable"
      />
      <p className="text-h4 text-strong">{title}</p>
      <p className="text-body-sm text-subtle max-w-[52ch]">{description}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {children}
        <ButtonLink href="/scenarios" variant="secondary">
          Return to the scenario index
        </ButtonLink>
      </div>
    </Card>
  );
}
