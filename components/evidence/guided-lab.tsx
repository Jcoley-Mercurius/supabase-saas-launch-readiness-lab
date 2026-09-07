"use client";

import { useState, useTransition } from "react";
import { replayDocumentedTest } from "@/app/scenarios/[slug]/actions";
import { EvidenceComparison } from "@/components/evidence/before-after";
import { ContextPanel } from "@/components/evidence/context-panel";
import { CoverageMatrix } from "@/components/evidence/coverage-matrix";
import { FindingSummary } from "@/components/evidence/finding-summary";
import { LabStepper, type StepStatus } from "@/components/evidence/lab-stepper";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { EvidenceRun } from "@/lib/evidence/executor";
import type { EvidenceScenario } from "@/lib/evidence/catalog";
import { EVIDENCE_PROVENANCE_NOTE } from "@/lib/evidence/catalog";
import type { EvidenceMode } from "@/lib/evidence/types";

/*
 * Guided lab orchestrator.
 *
 * Trace: MPS-REQ-003/004/005/012, MPS-RULE-002/007,
 *        MPS-ACC-003/004/005/006/014;
 *        MDS COMPOSITION-PROPOSAL "Scenario detail hierarchy";
 *        MDS-REF-006, MDS-REF-009 panel 3.
 *
 * State rules taken from the approved MDS:
 *  - the untested state is the honest start; it is never a pass;
 *  - running is a real state and the prior result is not silently replaced;
 *  - a failed replay produces the canonical unavailable state with a recovery
 *    route, and never converts into a pass by implication (MPS-ACC-014);
 *  - status changes announce through a live region while the full explanation
 *    stays visible;
 *  - focus is not moved on a status update, only on deliberate recovery.
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

export function GuidedLab({
  scenario,
  scenarioTitle,
  documentedTest,
}: {
  scenario: EvidenceScenario;
  scenarioTitle: string;
  documentedTest: string;
}) {
  const [phase, setPhase] = useState<Phase>("untested");
  const [before, setBefore] = useState<EvidenceRun | null>(null);
  const [after, setAfter] = useState<EvidenceRun | null>(null);
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
        ? "Running the documented test against the vulnerable policy set."
        : "Applying the remediated policy set and repeating the same documented test.",
    );
    setProblem(null);

    startTransition(async () => {
      try {
        const result = await replayDocumentedTest({
          scenarioId: scenario.id,
          mode,
        });

        if (result.status !== "ok") {
          setPhase("unavailable");
          setProblem(result.reason);
          setAnnouncement(
            "Evidence unavailable. No documented test result is shown, and nothing should be read as a pass.",
          );
          return;
        }

        const failures = result.run.cases.filter(
          (item) => item.evidence_state === "vulnerable",
        ).length;

        if (mode === "vulnerable") {
          setBefore(result.run);
          setPhase("vulnerable");
          setAnnouncement(
            `Documented test complete. ${failures} of ${result.run.cases.length} checks reproduced the boundary failure.`,
          );
        } else {
          setAfter(result.run);
          setPhase("remediated");
          setAnnouncement(
            `Repeated documented test complete. ${result.run.cases.length} of ${result.run.cases.length} checks were constrained as expected.`,
          );
        }
      } catch {
        // A failed round trip is a real recovery case, not a result.
        setPhase("unavailable");
        setProblem(
          "The documented evidence could not be retrieved. This is a delivery failure, not a test result.",
        );
        setAnnouncement(
          "Evidence unavailable. No documented test result is shown, and nothing should be read as a pass.",
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
  const matrixRows = activeRun?.matrix ?? null;

  /*
   * Provenance travels with every excerpt (MTS-OBS-005, owner-confirmed
   * 2026-09-06). The second sentence is the reproducibility claim: the
   * transcript is committed, and re-recording from a clean fixture must
   * reproduce it byte for byte. Saying so is what separates recorded evidence
   * from a staged screenshot, and it is checkable by anyone who clones the
   * repository — which is the point of disclosing it rather than only
   * disclosing that the run is a replay.
   */
  const provenance = activeRun
    ? `Recorded ${new Date(activeRun.recordedAt).toISOString().replace("T", " ").slice(0, 19)} UTC against ${activeRun.engine.product} ${activeRun.engine.version} on an ${activeRun.engine.host}. Fixture digest ${activeRun.inputDigest.slice(0, 23)}…. The transcript is committed to the repository; re-recording it from a clean database must reproduce it byte for byte, and the digest is checked against the fixture that produced it.`
    : "";

  const contextRelation = activeRun?.relations.find(
    (item) => item.resource === scenario.policyResource,
  );

  const modeLabel = after
    ? "remediated policy set"
    : before
      ? "vulnerable policy set"
      : "no documented run yet";

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
        <ContextPanel
          scenario={scenario}
          relation={contextRelation}
          modeLabel={modeLabel}
        />
      </aside>

      <div className="desktop:order-1 flex min-w-0 flex-col gap-8">
        <FindingSummary scenario={scenario} state={summaryState} />

        <LabStepper statuses={stepStatuses(phase)} />

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
          </div>

          {phase === "untested" ? (
            <StatusIndicator
              state="untested"
              variant="block"
              explanation="No documented test has been run in this session. An untested check is not a pass."
            />
          ) : null}

          {running ? (
            <StatusIndicator
              state="running"
              variant="block"
              explanation={
                phase === "running-vulnerable"
                  ? "Replaying the documented test against the vulnerable policy set. Any earlier result stays visible until this one completes."
                  : "Replaying the same documented test against the remediated policy set."
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
              loadingLabel="Running documented test"
              disableWhileLoading={false}
              className="max-w-full whitespace-normal"
            >
              {before
                ? "Run the vulnerable test again"
                : "Run the documented test"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => replay("remediated")}
              loading={phase === "running-remediated"}
              loadingLabel="Running documented test"
              disableWhileLoading={false}
              disabled={!before}
              aria-describedby={!before ? "remediation-hint" : undefined}
              className="max-w-full whitespace-normal"
            >
              Apply remediation and repeat the test
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
              The repeated test becomes available once the vulnerable proof has
              been run, so the two results are always compared against the same
              documented test.
            </p>
          ) : null}
        </Card>

        {before ? (
          <EvidenceComparison
            before={before.cases}
            after={after ? after.cases : null}
            boundary={scenario.affectedArea}
            limitation={scenario.limitation}
            provenance={provenance}
            summary={
              after
                ? "The same documented tests were repeated with no change to the statements, the actors, or the data — only the policy set changed. Every statement that previously crossed the tenant boundary now returns nothing or is refused, and the legitimate same-tenant paths still return their own rows."
                : "Only the vulnerable state has been recorded so far. Run the repeated test to compare each documented test against the remediated policy set."
            }
          />
        ) : null}

        {matrixRows ? (
          <section
            aria-labelledby="coverage-heading"
            className="flex min-w-0 flex-col gap-4"
          >
            <div>
              <h2 id="coverage-heading" className="text-h3 text-strong">
                RLS coverage matrix
              </h2>
              <p className="text-body text-subtle mt-2">
                Every protected resource and operation in the fixture,
                classified by what the documented tests actually produced —
                including the checks that belong to the other published
                scenario. A check with no documented test is shown as untested
                and must not be read as a pass.
              </p>
            </div>
            <CoverageMatrix
              rows={matrixRows}
              caption={`Every documented test recorded under the ${
                after ? "remediated" : "vulnerable"
              } policy set, across the whole synthetic fixture — including checks outside ${scenarioTitle}. Derived from the recorded run, not authored.`}
            />
          </section>
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
          <p className="mt-2">{EVIDENCE_PROVENANCE_NOTE}</p>
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
