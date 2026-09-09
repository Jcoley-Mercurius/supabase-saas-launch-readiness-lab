"use client";

import { useState, useTransition } from "react";
import { replayDocumentedSequence } from "@/app/scenarios/[slug]/actions";
import { FindingSummary } from "@/components/evidence/finding-summary";
import { LabStepper, type StepStatus } from "@/components/evidence/lab-stepper";
import { ReplayComparison } from "@/components/evidence/replay-comparison";
import { ReplayContextPanel } from "@/components/evidence/replay-context-panel";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { ReplayRun } from "@/lib/evidence/replay";
import type { ReplayScenario } from "@/lib/evidence/replay-catalog";
import { REPLAY_PROVENANCE_NOTE } from "@/lib/evidence/replay-catalog";
import { formatCents } from "@/lib/evidence/replay-present";
import type { EvidenceMode } from "@/lib/evidence/types";

/*
 * Replay and recovery lab orchestrator.
 *
 * Trace: MPS-REQ-006/007/012, MPS-RULE-002/007, MPS-ACC-007/008/014;
 *        MDS COMPOSITION-PROPOSAL "Scenario detail hierarchy";
 *        MDS-REF-006, MDS-REF-009 panel 3.
 *
 * It is the sibling of the S2 guided lab and follows the same approved state
 * rules:
 *  - the untested state is the honest start; it is never a pass;
 *  - running is a real state and the prior result is not silently replaced;
 *  - a failed replay produces the canonical unavailable state with a recovery
 *    route, and never converts into a pass by implication (MPS-ACC-014);
 *  - status changes announce through a live region while the full explanation
 *    stays visible;
 *  - focus is not moved on a status update, only on deliberate recovery.
 *
 * It is a separate component rather than a widened GuidedLab because the two
 * read different transcripts through different bounded executors, and the unit
 * of evidence differs: a documented test is one statement, a documented
 * sequence is an ordered set of deliveries whose verdict is a count.
 */

type Phase =
  | "untested"
  | "running-vulnerable"
  | "vulnerable"
  | "running-remediated"
  | "remediated"
  | "unavailable";

function stepStatuses(phase: Phase): StepStatus[] {
  switch (phase) {
    case "untested":
      return ["complete", "current", "blocked", "blocked", "blocked"];
    case "running-vulnerable":
      return ["complete", "current", "blocked", "blocked", "blocked"];
    case "vulnerable":
      return ["complete", "complete", "current", "available", "available"];
    case "running-remediated":
      return ["complete", "complete", "complete", "current", "blocked"];
    case "remediated":
      return ["complete", "complete", "complete", "complete", "current"];
    case "unavailable":
      return ["complete", "blocked", "blocked", "blocked", "available"];
  }
}

export function ReplayLab({
  scenario,
  documentedTest,
}: {
  scenario: ReplayScenario;
  documentedTest: string;
}) {
  const [phase, setPhase] = useState<Phase>("untested");
  const [before, setBefore] = useState<ReplayRun | null>(null);
  const [after, setAfter] = useState<ReplayRun | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function replay(mode: EvidenceMode) {
    // The run controls stay focusable while busy, so re-entry is guarded here
    // rather than by disabling the element the buyer just activated.
    if (phase === "running-vulnerable" || phase === "running-remediated")
      return;

    setPhase(
      mode === "vulnerable" ? "running-vulnerable" : "running-remediated",
    );
    setAnnouncement(
      mode === "vulnerable"
        ? "Replaying the documented delivery sequences against the vulnerable handler."
        : "Applying the remediated handler and repeating the same delivery sequences.",
    );
    setProblem(null);

    startTransition(async () => {
      try {
        const result = await replayDocumentedSequence({
          scenarioId: scenario.id,
          mode,
        });

        if (result.status !== "ok") {
          setPhase("unavailable");
          setProblem(result.reason);
          setAnnouncement(
            "Evidence unavailable. No documented sequence result is shown, and nothing should be read as a pass.",
          );
          return;
        }

        const total = result.run.sequences.length;
        const failures = result.run.sequences.filter(
          (item) => !item.expectation_met,
        ).length;

        if (mode === "vulnerable") {
          setBefore(result.run);
          setPhase("vulnerable");
          setAnnouncement(
            `Documented sequences complete. ${failures} of ${total} sequences did not reach the required end state.`,
          );
        } else {
          setAfter(result.run);
          setPhase("remediated");
          setAnnouncement(
            `Repeated sequences complete. ${total - failures} of ${total} sequences reached the required end state.`,
          );
        }
      } catch {
        // A failed round trip is a real recovery case, not a result.
        setPhase("unavailable");
        setProblem(
          "The documented evidence could not be retrieved. This is a delivery failure, not a test result.",
        );
        setAnnouncement(
          "Evidence unavailable. No documented sequence result is shown, and nothing should be read as a pass.",
        );
      }
    });
  }

  function reset() {
    if (phase === "running-vulnerable" || phase === "running-remediated")
      return;

    setPhase("untested");
    setBefore(null);
    setAfter(null);
    setProblem(null);
    setAnnouncement(
      "The scenario was reset to its untested state. No result is shown.",
    );
  }

  const running =
    phase === "running-vulnerable" || phase === "running-remediated";

  const summaryState =
    phase === "remediated"
      ? "remediated"
      : phase === "vulnerable"
        ? "vulnerable"
        : phase === "unavailable"
          ? "unavailable"
          : "untested";

  const activeRun = after ?? before;

  /*
   * Provenance travels with every excerpt (MTS-OBS-005, owner-confirmed
   * 2026-09-06). The second sentence is the reproducibility claim: the
   * transcript is committed, and re-recording from a clean fixture must
   * reproduce it byte for byte. Saying so is what separates recorded evidence
   * from a staged screenshot, and it is checkable by anyone who clones the
   * repository.
   */
  const provenance = activeRun
    ? `Recorded ${new Date(activeRun.recordedAt).toISOString().replace("T", " ").slice(0, 19)} UTC against ${activeRun.engine.product} ${activeRun.engine.version} on an ${activeRun.engine.host}. Fixture digest ${activeRun.inputDigest.slice(0, 23)}…. The transcript is committed to the repository; re-recording it from a clean database must reproduce it byte for byte, and the digest is checked against the fixture that produced it.`
    : "";

  const modeLabel = after
    ? "remediated handler"
    : before
      ? "vulnerable handler"
      : "no documented run yet";

  /*
   * The final state, in the buyer's terms, once both runs exist (MPS-ACC-008
   * requires the final state to be visible after recovery). Every number in it
   * is summed from the recorded sequences rather than written here.
   */
  const finalState =
    before && after
      ? (() => {
          const held = after.sequences.filter(
            (item) => item.expectation_met,
          ).length;
          const missedBefore = before.sequences.filter(
            (item) => !item.expectation_met,
          ).length;
          const duplicated = before.sequences.filter(
            (item) => item.observed_commitments > item.expected_commitments,
          ).length;
          const lost = before.sequences.filter(
            (item) => item.observed_commitments < item.expected_commitments,
          ).length;

          return `The identical deliveries were replayed against both handlers, with no change to any event, signature, amount, or ordering — only the handler configuration changed. Under the vulnerable handler ${missedBefore} of ${before.sequences.length} sequences did not reach the required end state: ${duplicated} committed the same work more than once and ${lost} lost it entirely. Under the remediated handler ${held} of ${after.sequences.length} reached the required end state, with every step checkpoint holding, and the legitimate first-delivery paths still committed exactly once.`;
        })()
      : "Only the vulnerable state has been recorded so far. Apply the remediated handler to compare each documented sequence against it.";

  return (
    /*
     * The approved guided-lab shell: flexible evidence canvas plus an optional
     * 280-320px context panel on desktop and wide. Below 960px the panel moves
     * beneath the scenario heading and before the primary proof, which the
     * order utilities below express directly in the DOM order — so the reading
     * order and the visual order agree at every viewport.
     */
    <div className="desktop:grid-cols-[minmax(0,1fr)_300px] desktop:items-start grid min-w-0 grid-cols-1 gap-8">
      <aside
        aria-label="Scenario context"
        className="desktop:order-2 desktop:sticky desktop:top-6 min-w-0"
      >
        <ReplayContextPanel
          scenario={scenario}
          handler={activeRun?.handler}
          modeLabel={modeLabel}
        />
      </aside>

      <div className="desktop:order-1 flex min-w-0 flex-col gap-8">
        <LabStepper statuses={stepStatuses(phase)} />

        <FindingSummary
          finding={scenario.finding}
          severity={scenario.severity}
          severityBasis={scenario.severityBasis}
          impact={scenario.impact}
          affectedArea={scenario.affectedArea}
          boundaryLabel="Boundary"
          boundary={scenario.boundary}
          state={summaryState}
        />

        {/*
         * The live region. It carries a concise result only; the full
         * explanation always remains visible in the page beneath it.
         */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <Card className="flex flex-col gap-5 p-5">
          <div>
            <h2 className="text-h4 text-strong">Documented test</h2>
            <p className="text-body text-subtle mt-2">{documentedTest}</p>
            <p className="text-body-sm text-subtle mt-3">
              Each documented sequence is an ordered set of synthetic
              deliveries. Its result is a counted end state — how many payment
              commitments exist and how much was applied — checked both at the
              end and at named steps along the way, so a sequence cannot be
              reported as correct because two errors happened to cancel.
            </p>
          </div>

          {phase === "untested" ? (
            <StatusIndicator
              state="untested"
              variant="block"
              explanation="No documented sequence has been replayed in this session. An untested check is not a pass."
            />
          ) : null}

          {running ? (
            <StatusIndicator
              state="running"
              variant="block"
              explanation={
                phase === "running-vulnerable"
                  ? "Replaying the documented delivery sequences against the vulnerable handler. Any earlier result stays visible until this one completes."
                  : "Replaying the same delivery sequences against the remediated handler."
              }
            />
          ) : null}

          {phase === "unavailable" ? (
            <>
              <StatusIndicator
                state="unavailable"
                variant="block"
                explanation={
                  problem ??
                  "The documented evidence could not be retrieved. No result is implied."
                }
              />
              <Alert tone="warning" title="This is not a result">
                <p>
                  An unavailable demonstration says nothing about whether the
                  control holds. The scenario keeps its context and you can
                  retry, or continue to the report and the other scenarios.
                </p>
              </Alert>
            </>
          ) : null}

          {before ? (
            <dl className="text-body-sm border-line tablet:grid-cols-[auto_minmax(0,1fr)] grid grid-cols-1 gap-x-6 gap-y-1 border-t pt-4">
              <dt className="text-subtle font-semibold">Sequences replayed</dt>
              <dd className="text-strong">
                {before.sequences.length} under the vulnerable handler
                {after
                  ? `, the same ${after.sequences.length} again under the remediated handler`
                  : ""}
              </dd>
              <dt className="text-subtle font-semibold">
                Total committed, vulnerable handler
              </dt>
              <dd className="text-strong">
                {before.sequences.reduce(
                  (sum, item) => sum + item.observed_commitments,
                  0,
                )}{" "}
                commitment(s) ·{" "}
                {formatCents(
                  before.sequences.reduce(
                    (sum, item) => sum + item.observed_applied_cents,
                    0,
                  ),
                )}
              </dd>
              {after ? (
                <>
                  <dt className="text-subtle font-semibold">
                    Total committed, remediated handler
                  </dt>
                  <dd className="text-strong">
                    {after.sequences.reduce(
                      (sum, item) => sum + item.observed_commitments,
                      0,
                    )}{" "}
                    commitment(s) ·{" "}
                    {formatCents(
                      after.sequences.reduce(
                        (sum, item) => sum + item.observed_applied_cents,
                        0,
                      ),
                    )}
                  </dd>
                </>
              ) : null}
            </dl>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {/*
             * whitespace-normal overrides the shared button default. These
             * labels are long by necessity, and at 320px a nowrap label is
             * wider than the content column, which scrolls the whole page
             * sideways. Wrapping keeps the control inside the gutter without
             * shortening a label that has to stay precise.
             */}
            <Button
              onClick={() => replay("vulnerable")}
              loading={phase === "running-vulnerable"}
              loadingLabel="Replaying documented sequences"
              disableWhileLoading={false}
              className="max-w-full whitespace-normal"
            >
              {before
                ? "Replay the vulnerable sequences again"
                : "Replay the documented sequences"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => replay("remediated")}
              loading={phase === "running-remediated"}
              loadingLabel="Replaying documented sequences"
              disableWhileLoading={false}
              disabled={!before}
              aria-describedby={!before ? "remediation-hint" : undefined}
              className="max-w-full whitespace-normal"
            >
              Apply the remediated handler and repeat
            </Button>

            <Button
              variant="quiet"
              onClick={reset}
              aria-disabled={running || undefined}
              className="max-w-full whitespace-normal"
            >
              <Icon name="rotate-ccw" size={16} />
              Reset and retry
            </Button>
          </div>

          {!before ? (
            <p id="remediation-hint" className="text-body-sm text-subtle">
              The repeated run becomes available once the vulnerable proof has
              been replayed, so the two results are always compared against the
              same deliveries.
            </p>
          ) : null}
        </Card>

        {before ? (
          <ReplayComparison
            before={before.sequences}
            after={after ? after.sequences : null}
            beforeHandler={before.handler}
            afterHandler={after ? after.handler : null}
            limitation={scenario.limitation}
            provenance={provenance}
            summary={finalState}
          />
        ) : null}

        <section
          aria-labelledby="remediation-heading"
          className="flex min-w-0 flex-col gap-4"
        >
          <h2 id="remediation-heading" className="text-h3 text-strong">
            Remediation direction
          </h2>
          <ol className="flex flex-col gap-3">
            {scenario.remediation.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="border-line text-label text-subtle bg-base rounded-pill flex size-7 shrink-0 items-center justify-center border">
                  {index + 1}
                </span>
                <span className="text-body text-subtle">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <LimitationCallout title="What this proves, and what it does not">
          <p>{scenario.limitation}</p>
          <p className="mt-2">{REPLAY_PROVENANCE_NOTE}</p>
          <p className="mt-2">
            A result here describes this documented synthetic scenario only. It
            is not a certification, a formal penetration test, or a statement
            about any other system, and running it grants no permission to test
            anyone else&rsquo;s project.
          </p>
        </LimitationCallout>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/report" variant="secondary" trailingArrow>
            View sample report
          </ButtonLink>
          <ButtonLink href="/scenarios" variant="quiet" trailingArrow>
            Back to all scenarios
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
