import type { Metadata } from "next";
import { AuthorizedReviewBand } from "@/components/layout/authorized-review-band";
import { Container, Section } from "@/components/layout/container";
import { CoverageMatrix } from "@/components/evidence/coverage-matrix";
import { ProofSteps } from "@/components/scenarios/proof-steps";
import { ReportFindingArticle } from "@/components/report/report-finding";
import { ReportHeader } from "@/components/report/report-header";
import { ReportIndex } from "@/components/report/report-index";
import { ReportProse, ReportSection } from "@/components/report/report-section";
import { SequenceSummary } from "@/components/report/sequence-summary";
import { SeverityOverview } from "@/components/report/severity-overview";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LimitationCallout } from "@/components/ui/limitation-callout";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  CASE_STUDY,
  EXECUTIVE_SUMMARY,
  FINDINGS_INTRO,
  LIMITATIONS,
  MATRIX_INTRO,
  METHOD_INTRO,
  NOT_TESTED,
  REMEDIATION_INTRO,
  REPORT_FRAMING,
  REPORT_SECTIONS,
  SEVERITY_OVERVIEW,
  WEBHOOK_INTRO,
} from "@/lib/content/report";
import { PRIMARY_CTA } from "@/lib/content/site";
import { EVIDENCE_PROVENANCE_NOTE } from "@/lib/evidence/catalog";
import {
  AFTER_FIX,
  AS_FOUND,
  RANKING_BASIS,
  buildReportModel,
} from "@/lib/evidence/report";
import { allRecordedSequences } from "@/lib/evidence/replay";
import { REPLAY_PROVENANCE_NOTE } from "@/lib/evidence/replay-catalog";
import { evidenceStateLabel } from "@/components/ui/status-indicator";

/*
 * Sample report route.
 *
 * Trace: MPS-REQ-008 (every finding carries its seven required parts),
 *        MPS-REQ-009 and MPS-ACC-010 (reachable, and the authorized-engagement
 *        CTA is reachable from it, without completing a scenario or creating an
 *        account), MPS-RULE-002/007, MPS-ACC-005/009/014;
 *        MDS COMPOSITION-PROPOSAL "Audit report shell" (the eight sections, in
 *        order), DESIGN-SYSTEM.md §13 "Sample report"; MDS-REF-007.
 *
 * Composition, per the approved report shell: a sticky section index beside
 * one report column, becoming an in-flow table of contents below desktop.
 * Prose is held to the approved 760px reading measure; matrices, tables, and
 * evidence take the full width of the shell.
 *
 * The report renders every section and every finding fully expanded, with no
 * filter and no collapse control, because the approved shell requires it to
 * "remain readable/printable without interaction". It is a static server
 * component: nothing on this route runs a documented test, and nothing on it
 * needs JavaScript to be read.
 *
 * Every count, state, date, and excerpt comes from lib/evidence/report.ts,
 * which derives them from the two committed transcripts. This file lays out a
 * report; it cannot author a result.
 */

export const metadata: Metadata = {
  title: "Sample report",
  description:
    "A severity-ranked sample report from the Supabase SaaS Launch-Readiness Lab: documented findings, reproduction evidence, remediation direction, and the limits of what each result proves. Synthetic data only.",
};

function sectionHeading(id: (typeof REPORT_SECTIONS)[number]["id"]) {
  const section = REPORT_SECTIONS.find((item) => item.id === id);
  if (!section) throw new Error(`Unknown report section: ${id}`);
  return section.heading;
}

export default function ReportPage() {
  const model = buildReportModel();
  const asFoundSequences = allRecordedSequences(AS_FOUND);
  const afterFixSequences = allRecordedSequences(AFTER_FIX);

  return (
    <>
      <ReportHeader recordedAt={model.recordedAt} />

      <Section tone="canvas" spacing="compact">
        <Container width="evidence">
          <div className="desktop:grid-cols-[224px_minmax(0,1fr)] desktop:gap-12 grid min-w-0 grid-cols-1 gap-8">
            <ReportIndex />

            <div className="flex min-w-0 flex-col gap-10">
              {/* 1 — Executive summary and synthetic scope */}
              <ReportSection
                id="executive-summary"
                heading={sectionHeading("executive-summary")}
                intro={<p>{EXECUTIVE_SUMMARY.intro}</p>}
              >
                <Alert tone="info" title={REPORT_FRAMING.title}>
                  <p>{REPORT_FRAMING.body}</p>
                </Alert>

                <div className="desktop:grid-cols-2 grid grid-cols-1 gap-4">
                  <Card className="flex flex-col gap-3 p-5">
                    <h3 className="text-h4 text-strong">
                      {EXECUTIVE_SUMMARY.scopeHeading}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {EXECUTIVE_SUMMARY.scope.map((item) => (
                        <li key={item} className="text-body-sm text-subtle">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="flex flex-col gap-3 p-5">
                    <h3 className="text-h4 text-strong">
                      {EXECUTIVE_SUMMARY.outOfScopeHeading}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {EXECUTIVE_SUMMARY.outOfScope.map((item) => (
                        <li key={item} className="text-body-sm text-subtle">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                <StatusIndicator
                  state={model.checks.asFound.state}
                  variant="block"
                  explanation={`Across ${model.findings.length} documented areas, ${model.checks.asFound.unmet} of ${model.checks.asFound.total} documented checks did not meet their expectation in the configuration as found. Repeated against the remediated configuration, ${model.checks.afterFix.met} of ${model.checks.afterFix.total} were constrained as expected — for those documented checks and their documented scope only.`}
                />

                {model.matrix.rowSecurityChanges.length > 0 ? (
                  <Alert
                    tone="vulnerable"
                    title="A configuration change is part of the fix, not only a policy change"
                  >
                    <p>
                      Row level security was not enabled on{" "}
                      {model.matrix.rowSecurityChanges
                        .map((row) => row.resource)
                        .join(", ")}{" "}
                      in the configuration as found. A relation reachable
                      through a role grant with row level security switched off
                      consults no policy at all, so no policy review would have
                      caught it.
                    </p>
                  </Alert>
                ) : null}
              </ReportSection>

              {/* 2 — Severity overview with counts by documented state */}
              <ReportSection
                id="severity-overview"
                heading={sectionHeading("severity-overview")}
                intro={<p>{SEVERITY_OVERVIEW.intro}</p>}
              >
                <SeverityOverview model={model} />
                <ReportProse>
                  <p className="text-body-sm text-subtle">
                    <span className="text-strong font-semibold">Note. </span>
                    {SEVERITY_OVERVIEW.note}
                  </p>
                </ReportProse>
              </ReportSection>

              {/* 3 — Findings, ordered by launch risk and dependency */}
              <ReportSection
                id="findings"
                heading={sectionHeading("findings")}
                intro={<p>{FINDINGS_INTRO.body}</p>}
              >
                <ReportProse className="flex flex-col gap-3">
                  <p className="text-body-sm text-subtle">
                    <span className="text-strong font-semibold">
                      How these are ordered.{" "}
                    </span>
                    {RANKING_BASIS}
                  </p>
                  <p className="text-body-sm text-subtle">
                    <span className="text-strong font-semibold">
                      Evidence shown.{" "}
                    </span>
                    {FINDINGS_INTRO.evidenceNote}
                  </p>
                </ReportProse>

                <div className="flex min-w-0 flex-col gap-10">
                  {model.findings.map((finding) => (
                    <ReportFindingArticle key={finding.id} finding={finding} />
                  ))}
                </div>
              </ReportSection>

              {/* 4 — RLS coverage matrix */}
              <ReportSection
                id="coverage-matrix"
                heading={sectionHeading("coverage-matrix")}
                intro={<p>{MATRIX_INTRO.body}</p>}
              >
                <CoverageMatrix
                  rows={model.matrix.asFound}
                  caption={`Policy coverage for the fixture's protected relations in the configuration as found. ${EVIDENCE_PROVENANCE_NOTE}`}
                />

                <ReportProse>
                  <p className="text-body-sm text-subtle">
                    <span className="text-strong font-semibold">
                      After the documented fix.{" "}
                    </span>
                    The identical checks against the remediated configuration
                    produce{" "}
                    {model.matrix.afterFixCounts
                      .map(
                        (entry) =>
                          `${entry.count} ${evidenceStateLabel(entry.state).toLowerCase()}`,
                      )
                      .join(", ")}
                    . The untested and not-applicable cells do not change,
                    because applying a fix does not create a check that was
                    never written.
                  </p>
                </ReportProse>
              </ReportSection>

              {/* 5 — Webhook and recovery evidence */}
              <ReportSection
                id="webhook-recovery"
                heading={sectionHeading("webhook-recovery")}
                intro={<p>{WEBHOOK_INTRO.body}</p>}
              >
                <SequenceSummary
                  asFound={asFoundSequences}
                  afterFix={afterFixSequences}
                  caption={`Every documented delivery sequence, under both handler configurations. ${REPLAY_PROVENANCE_NOTE}`}
                />
                <ReportProse>
                  <p className="text-body-sm text-subtle">
                    <span className="text-strong font-semibold">
                      What changed between the runs.{" "}
                    </span>
                    {WEBHOOK_INTRO.configurationNote}
                  </p>
                </ReportProse>
              </ReportSection>

              {/* 6 — Remediation order and reference patterns */}
              <ReportSection
                id="remediation"
                heading={sectionHeading("remediation")}
                intro={<p>{REMEDIATION_INTRO.body}</p>}
              >
                <ol className="flex min-w-0 flex-col gap-4">
                  {model.findings.map((finding) => (
                    <li key={finding.id}>
                      <Card className="flex flex-col gap-3 p-5">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-h4 text-strong">
                            {finding.rank}. {finding.pillar}
                          </h3>
                          <p className="text-body-sm text-subtle">
                            {finding.severity} severity ·{" "}
                            {finding.asFound.unmet} of {finding.asFound.total}{" "}
                            {finding.checkNoun}
                            {finding.asFound.total === 1 ? "" : "s"} unmet as
                            found
                          </p>
                        </div>
                        <ol className="flex max-w-[760px] flex-col gap-2">
                          {finding.remediation.map((step) => (
                            <li
                              key={step}
                              className="text-body-sm text-subtle ms-5 list-disc marker:text-(--color-untested)"
                            >
                              {step}
                            </li>
                          ))}
                        </ol>
                      </Card>
                    </li>
                  ))}
                </ol>

                <ReportProse>
                  <p className="text-body-sm text-subtle">
                    <span className="text-strong font-semibold">
                      Keep the checks.{" "}
                    </span>
                    {REMEDIATION_INTRO.pipelineNote}
                  </p>
                </ReportProse>
              </ReportSection>

              {/* 7 — Method, limitations, and what was not tested */}
              <ReportSection
                id="method-limitations"
                heading={sectionHeading("method-limitations")}
                intro={<p>{METHOD_INTRO.body}</p>}
              >
                <ProofSteps />

                <ReportProse>
                  <p className="text-body-sm text-subtle">
                    <span className="text-strong font-semibold">
                      Reproducibility.{" "}
                    </span>
                    {METHOD_INTRO.reproducibility}
                  </p>
                </ReportProse>

                <Card tone="muted" className="flex flex-col gap-2 p-5">
                  <h3 className="text-h4 text-strong">Evidence provenance</h3>
                  <dl className="text-body-sm tablet:grid-cols-[auto_minmax(0,1fr)] grid grid-cols-1 gap-x-6 gap-y-1">
                    <dt className="text-subtle font-semibold">Recorded</dt>
                    <dd className="text-strong">{model.recordedAt}</dd>
                    <dt className="text-subtle font-semibold">Engine</dt>
                    <dd className="text-strong">
                      {model.engine.product} {model.engine.version} ·{" "}
                      {model.engine.host}
                    </dd>
                    <dt className="text-subtle font-semibold">
                      Fixture digest
                    </dt>
                    <dd className="text-strong font-mono break-all">
                      {model.inputDigest}
                    </dd>
                  </dl>
                  <p className="text-body-sm text-subtle">
                    {model.provenanceIsSingle
                      ? "Both transcripts came out of one recorder run against one fixture, so every result in this report shares this provenance."
                      : "The two transcripts do not share a recording. Each excerpt carries its own provenance caption, and the two should not be read as one run."}
                  </p>
                </Card>

                <h3 className="text-h3 text-strong mt-2">
                  {LIMITATIONS.heading}
                </h3>
                <ul className="desktop:grid-cols-2 grid grid-cols-1 gap-4">
                  {LIMITATIONS.items.map((item) => (
                    <li key={item.title}>
                      <LimitationCallout title={item.title}>
                        <p>{item.body}</p>
                      </LimitationCallout>
                    </li>
                  ))}
                </ul>

                <h3 className="text-h3 text-strong mt-2">
                  {NOT_TESTED.heading}
                </h3>
                <ReportProse>
                  <p className="text-body text-subtle">{NOT_TESTED.body}</p>
                </ReportProse>

                <Card className="flex flex-col gap-4 p-5">
                  <h4 className="text-h4 text-strong">
                    Operations with no recorded result
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {model.matrix.withoutResult.map((cell) => (
                      <li
                        key={`${cell.resource}-${cell.operation}`}
                        className="text-body-sm text-subtle"
                      >
                        <span className="text-strong font-mono">
                          {cell.resource}.{cell.operation}
                        </span>{" "}
                        —{" "}
                        <span className="font-semibold">
                          {evidenceStateLabel(cell.state)}
                        </span>
                        . {cell.reason}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="flex flex-col gap-4 p-5">
                  <h4 className="text-h4 text-strong">
                    What each finding does not cover
                  </h4>
                  <dl className="flex flex-col gap-4">
                    {model.findings.map((finding) => (
                      <div key={finding.id}>
                        <dt className="text-body-sm text-strong font-semibold">
                          {finding.pillar}
                        </dt>
                        <dd className="text-body-sm text-subtle mt-1">
                          {finding.limitation}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </ReportSection>

              {/* 8 — Case study and authorized-engagement CTA */}
              <ReportSection
                id="case-study"
                heading={sectionHeading("case-study")}
                intro={<p>{CASE_STUDY.intro}</p>}
              >
                <ol className="flex min-w-0 flex-col gap-4">
                  {CASE_STUDY.steps.map((step, index) => (
                    <li key={step.title}>
                      <Card className="flex gap-4 p-5">
                        <span
                          aria-hidden="true"
                          className="text-label text-subtle border-line bg-canvas mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border tabular-nums"
                        >
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-h4 text-strong">{step.title}</h3>
                          <p className="text-body text-subtle mt-2">
                            {step.body}
                          </p>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ol>

                <ReportProse className="flex flex-col gap-4">
                  <p className="text-body-lg text-subtle">
                    {CASE_STUDY.closing}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <ButtonLink href={PRIMARY_CTA.href} size="lg" trailingArrow>
                      {PRIMARY_CTA.label}
                    </ButtonLink>
                    <ButtonLink href="/scenarios" variant="secondary">
                      Explore the scenarios
                    </ButtonLink>
                  </div>
                </ReportProse>
              </ReportSection>
            </div>
          </div>
        </Container>
      </Section>

      <AuthorizedReviewBand />
    </>
  );
}
