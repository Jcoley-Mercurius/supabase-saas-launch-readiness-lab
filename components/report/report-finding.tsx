import { EvidenceComparison } from "@/components/evidence/before-after";
import { FindingSummary } from "@/components/evidence/finding-summary";
import { ReplayComparison } from "@/components/evidence/replay-comparison";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { CheckOutcome, ReportFinding } from "@/lib/evidence/report";

/*
 * One report finding (MPS-REQ-008: severity, affected boundary, reproduction
 * evidence, impact, remediation direction, before/after status, and
 * limitation; MPS-ACC-009; MDS COMPOSITION-PROPOSAL "Audit report shell"
 * section 3; MDS-REF-007 "Findings").
 *
 * All seven required parts are present and none is behind a control. The
 * finding renders fully expanded, with no filter and no collapse: the approved
 * report shell must "remain readable/printable without interaction", and a
 * control here could only ever hide evidence. Depth that would bury the report
 * — every check in the area, every delivery in a sequence — stays in the
 * scenario, which each finding links to.
 *
 * Every component below is the approved shared one, used unchanged: the
 * finding summary band, the evidence-state indicator, the before/after
 * comparison for each scenario family, and the limitation callout. This file
 * introduces no visual convention of its own.
 */

function BeforeAfterStatus({
  asFound,
  afterFix,
  checkNoun,
}: {
  asFound: CheckOutcome;
  afterFix: CheckOutcome;
  checkNoun: string;
}) {
  const plural = (count: number) =>
    `${count} ${checkNoun}${count === 1 ? "" : "s"}`;

  return (
    <div className="desktop:grid-cols-2 grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-label text-subtle uppercase">As found</h4>
        <StatusIndicator
          state={asFound.state}
          variant="block"
          explanation={`${plural(asFound.unmet)} of ${asFound.total} did not meet the documented expectation in the configuration as found.`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-label text-subtle uppercase">
          After the documented fix
        </h4>
        <StatusIndicator
          state={afterFix.state}
          variant="block"
          explanation={`The identical ${plural(afterFix.total)} were repeated against the remediated configuration; ${afterFix.unmet === 0 ? "each was constrained as expected" : `${plural(afterFix.unmet)} still did not meet the expectation`}. This covers the documented checks only.`}
        />
      </div>
    </div>
  );
}

export function ReportFindingArticle({ finding }: { finding: ReportFinding }) {
  return (
    <article
      id={`finding-${finding.id}`}
      aria-labelledby={`finding-${finding.id}-heading`}
      className="border-line flex min-w-0 scroll-mt-24 flex-col gap-6 border-t pt-8 first:border-t-0 first:pt-0"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3
          id={`finding-${finding.id}-heading`}
          className="text-label text-subtle uppercase"
        >
          Finding {finding.rank} · {finding.pillar}
        </h3>
        <p className="text-label text-subtle font-mono">
          {finding.representativeId}
        </p>
      </div>

      <FindingSummary
        finding={finding.finding}
        severity={finding.severity}
        severityBasis={finding.severityBasis}
        impact={finding.impact}
        affectedArea={finding.affectedArea}
        boundaryLabel={finding.boundaryLabel}
        boundary={finding.boundary}
        state={finding.asFound.state}
      />

      <div>
        <h4 className="text-h4 text-strong">Documented test</h4>
        <p className="text-body text-subtle mt-2 max-w-[760px]">
          {finding.documentedTest}
        </p>
      </div>

      <BeforeAfterStatus
        asFound={finding.asFound}
        afterFix={finding.afterFix}
        checkNoun={finding.checkNoun}
      />

      <div className="flex min-w-0 flex-col gap-4">
        <h4 className="text-h4 text-strong">Reproduction evidence</h4>
        {finding.evidence.kind === "authorization" ? (
          <EvidenceComparison
            before={finding.evidence.before}
            after={finding.evidence.after}
            boundary={finding.boundary}
            limitation={finding.limitation}
            provenance={finding.provenance}
            summary="The same documented test, run against both configurations. Only the policy set changed between the two runs — the statement, the acting identity, and the data are identical."
          />
        ) : (
          <ReplayComparison
            before={finding.evidence.before}
            after={finding.evidence.after}
            beforeHandler={finding.evidence.beforeHandler}
            afterHandler={finding.evidence.afterHandler}
            limitation={finding.limitation}
            provenance={finding.provenance}
            summary="The same documented sequence, delivered to both handler configurations. The events are identical in both runs — only the handler changed."
          />
        )}
      </div>

      <div>
        <h4 className="text-h4 text-strong">Remediation direction</h4>
        <ol className="mt-3 flex max-w-[760px] flex-col gap-3">
          {finding.remediation.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden="true"
                className="text-label text-subtle border-line bg-canvas mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border tabular-nums"
              >
                {index + 1}
              </span>
              <span className="text-body text-subtle">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <LimitationCallout className="max-w-[760px]">
        <p>{finding.limitation}</p>
      </LimitationCallout>

      {/*
       * The visible label is short so the control fits the narrowest supported
       * width: the approved button sets `whitespace-nowrap`, and a label
       * carrying the area name pushed the page into a horizontal scroll at
       * 320px. The area name stays in the accessible name, so the four links
       * are still distinguishable in a list of links, and the visible text is a
       * prefix of that name — which is what WCAG 2.2 AA 2.5.3 Label in Name
       * requires.
       */}
      <Card tone="muted" className="flex flex-wrap items-center gap-4 p-4">
        <p className="text-body-sm text-subtle min-w-0 flex-1">
          Every {finding.checkNoun} in this area is runnable in the scenario,
          with the full evidence for each one.
        </p>
        <ButtonLink
          href={finding.scenarioHref}
          variant="secondary"
          trailingArrow
        >
          Open the lab
          <span className="sr-only"> for {finding.pillar}</span>
        </ButtonLink>
      </Card>
    </article>
  );
}
