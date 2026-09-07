import { CodeExcerpt } from "@/components/evidence/code-excerpt";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { buildExcerptTabs } from "@/lib/evidence/present";
import type { RecordedCase } from "@/lib/evidence/types";

/*
 * Evidence panel (MDS DESIGN-SYSTEM.md §10; COMPONENTS-PROPOSAL "Evidence
 * panel"; MDS-REF-006).
 *
 * The approved contract is: test name, affected boundary, state, plain-language
 * consequence, evidence excerpt, test identifier, and limitation.
 *
 * Two layouts, both of which deliver all seven parts:
 *
 *  "full"   — the standalone panel. Every part is inside the panel.
 *  "paired" — the panel as one half of a before/after comparison. The parts
 *             that are identical across the pair (name, identifier, boundary,
 *             actor, consequence, limitation) are rendered once by the
 *             comparison above and below the pair rather than twice per test,
 *             and the panel carries the parts that actually differ: the state
 *             and the evidence excerpt. Repeating the shared parts in both
 *             columns pushes the two excerpts apart and makes the comparison
 *             harder to read, which works against the approved requirement
 *             that the pair keep equal, synchronised hierarchy.
 */
export function EvidencePanel({
  recorded,
  boundary,
  limitation,
  provenance,
  layout = "full",
}: {
  recorded: RecordedCase;
  boundary: string;
  limitation: string;
  provenance: string;
  layout?: "full" | "paired";
}) {
  const paired = layout === "paired";

  return (
    <Card className="flex min-w-0 flex-col gap-4 p-5">
      {!paired ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className="text-h4 text-strong">{recorded.title}</h4>
            <p className="text-label text-subtle font-mono">
              {recorded.case_id}
            </p>
          </div>

          <dl className="text-body-sm tablet:grid-cols-[auto_minmax(0,1fr)] grid grid-cols-1 gap-x-6 gap-y-2">
            <dt className="text-subtle font-semibold">Affected boundary</dt>
            <dd className="text-strong">{boundary}</dd>
            <dt className="text-subtle font-semibold">Acting as</dt>
            <dd className="text-strong">{recorded.actor_label}</dd>
          </dl>
        </>
      ) : null}

      <StatusIndicator
        state={recorded.evidence_state}
        variant="block"
        explanation={
          paired
            ? recorded.evidence_state === "vulnerable"
              ? "The documented test reached across the boundary. The action should have been blocked."
              : "The documented test was constrained as expected. Evidence of the refusal is below."
            : recorded.intent
        }
      />

      {!paired ? (
        <p className="text-body text-subtle">{recorded.consequence}</p>
      ) : null}

      <CodeExcerpt
        tabs={buildExcerptTabs(recorded)}
        caption={provenance}
        redaction="Identifiers are abbreviated here for width. The Response view shows every recorded value in full — nothing was withheld."
      />

      {!paired ? (
        <p className="border-line text-body-sm text-subtle border-t pt-4">
          <span className="text-strong font-semibold">Limitation. </span>
          {limitation}
        </p>
      ) : null}
    </Card>
  );
}
