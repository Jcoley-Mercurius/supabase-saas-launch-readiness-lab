/*
 * The severity-ranked report model.
 *
 * Trace: MPS-REQ-008 (every finding carries severity, affected boundary,
 *        reproduction evidence, impact, remediation direction, before/after
 *        status, and limitation), MPS-REQ-009, MPS-RULE-002/007,
 *        MPS-ACC-005/009/010;
 *        MDS COMPOSITION-PROPOSAL "Audit report shell" (the eight approved
 *        sections), DESIGN-SYSTEM.md §13 "Sample report"; MDS-REF-007.
 *
 * The whole report is DERIVED. Nothing in this module authors a result, a
 * count, a severity, or a state:
 *
 *  - the buyer-facing framing (finding title, severity, severity basis,
 *    impact, affected area, remediation direction, limitation) is read from
 *    the S2 and S3 catalogs, which are the approved authored layer;
 *  - every count, evidence state, before/after status, matrix cell, and
 *    reproduction excerpt is read from the two committed transcripts;
 *  - the ordering is computed from those counts by a stated rule, not chosen.
 *
 * That division is the point. A report is the surface where an invented number
 * would do the most damage, so the report has no way to produce one: if a fact
 * is not in a catalog or a transcript, it does not appear here.
 *
 * Prohibited vocabulary — secure, certified, compliant, guaranteed, or an
 * unqualified "passed" — must never appear in this file.
 */

import type { EvidenceState } from "@/components/ui/status-indicator";
import { SCENARIOS } from "@/lib/content/scenarios";
import {
  EVIDENCE_PROVENANCE_NOTE,
  EVIDENCE_SCENARIOS,
} from "@/lib/evidence/catalog";
import {
  allRecordedCases,
  recordedRelations,
  transcriptProvenance,
} from "@/lib/evidence/executor";
import { resultLine } from "@/lib/evidence/present";
import {
  MATRIX_OPERATIONS,
  buildCoverageMatrix,
  summariseMatrix,
} from "@/lib/evidence/matrix";
import {
  REPLAY_PROVENANCE_NOTE,
  REPLAY_SCENARIOS,
} from "@/lib/evidence/replay-catalog";
import {
  allRecordedSequences,
  recordedHandler,
  replayTranscriptProvenance,
} from "@/lib/evidence/replay";
import type {
  HandlerSnapshot,
  RecordedSequence,
} from "@/lib/evidence/replay-types";
import { REPLAY_SCENARIO_IDS } from "@/lib/evidence/replay-types";
import { EVIDENCE_SCENARIO_IDS } from "@/lib/evidence/types";
import type {
  EvidenceMode,
  MatrixRow,
  RecordedCase,
} from "@/lib/evidence/types";

/** The severity vocabulary the approved catalogs use. There is no other level. */
export const SEVERITIES = ["High", "Medium", "Low"] as const;
export type Severity = (typeof SEVERITIES)[number];

/**
 * The two documented configurations, named for the report rather than for the
 * lab. "As found" is the vulnerable configuration — the state a review would
 * encounter. "After the documented fix" is the remediated one.
 */
export const AS_FOUND: EvidenceMode = "vulnerable";
export const AFTER_FIX: EvidenceMode = "remediated";

/** Worst observed state wins, so one failure cannot be averaged away. */
const SEVERITY_ORDER: EvidenceState[] = [
  "vulnerable",
  "warning",
  "unavailable",
  "remediated",
];

function worst(states: EvidenceState[]): EvidenceState {
  for (const candidate of SEVERITY_ORDER) {
    if (states.includes(candidate)) return candidate;
  }
  return "untested";
}

/** How one finding's documented checks came out in one configuration. */
export type CheckOutcome = {
  /** Documented checks belonging to this finding. */
  total: number;
  /** Checks that did not meet their documented expectation. */
  unmet: number;
  /** Checks that met it. */
  met: number;
  /** Worst state observed across them. Never an average. */
  state: EvidenceState;
};

function outcomeOf(
  items: Array<{ expectation_met: boolean; evidence_state: EvidenceState }>,
): CheckOutcome {
  const unmet = items.filter((item) => !item.expectation_met).length;
  return {
    total: items.length,
    unmet,
    met: items.length - unmet,
    state: worst(items.map((item) => item.evidence_state)),
  };
}

/** The reproduction evidence carried by one finding, by scenario family. */
export type FindingEvidence =
  | {
      kind: "authorization";
      /** The representative failing test, as found. */
      before: RecordedCase[];
      /** The identical test after the documented fix. */
      after: RecordedCase[];
    }
  | {
      kind: "replay";
      before: RecordedSequence[];
      after: RecordedSequence[];
      beforeHandler: HandlerSnapshot;
      afterHandler: HandlerSnapshot | null;
    };

export type ReportFinding = {
  id: string;
  /** Position in the report, 1-based. Produced by `rankFindings`. */
  rank: number;
  /** Risk pillar, from the approved scenario list. */
  pillar: string;
  scenarioHref: string;
  finding: string;
  severity: Severity;
  severityBasis: string;
  impact: string;
  affectedArea: string;
  boundaryLabel: string;
  boundary: string;
  remediation: readonly string[];
  limitation: string;
  documentedTest: string;
  /** "documented test" for S2 findings, "documented sequence" for S3. */
  checkNoun: string;
  asFound: CheckOutcome;
  afterFix: CheckOutcome;
  evidence: FindingEvidence;
  provenance: string;
  /** Identifier of the representative check shown as reproduction evidence. */
  representativeId: string;
};

/** One row of the findings-by-area table (MDS-REF-007 "Findings by area"). */
export type AreaRow = {
  pillar: string;
  severity: Severity;
  findings: number;
  checks: number;
  unmetAsFound: number;
  unmetAfterFix: number;
  state: EvidenceState;
};

export type ReportModel = {
  /** True when both transcripts came out of the same recorder run. */
  provenanceIsSingle: boolean;
  recordedAt: string;
  engine: { product: string; version: string; host: string; note: string };
  inputDigest: string;
  findings: ReportFinding[];
  severityCounts: Array<{ severity: Severity; count: number }>;
  /** Documented checks across every finding, by configuration. */
  checks: { asFound: CheckOutcome; afterFix: CheckOutcome };
  areas: AreaRow[];
  matrix: {
    asFound: MatrixRow[];
    afterFix: MatrixRow[];
    asFoundCounts: Array<{ state: EvidenceState; count: number }>;
    afterFixCounts: Array<{ state: EvidenceState; count: number }>;
    /** Cells with no result, and the recorded reason each one has none. */
    withoutResult: Array<{
      resource: string;
      operation: string;
      state: EvidenceState;
      reason: string;
    }>;
    /** Relations whose row-security configuration differs between the two. */
    rowSecurityChanges: Array<{
      resource: string;
      asFound: boolean;
      afterFix: boolean;
    }>;
  };
};

function severityRank(severity: Severity): number {
  return SEVERITIES.indexOf(severity);
}

/**
 * The ordering rule, stated once and applied everywhere the report ranks
 * findings. MDS requires findings "ordered by launch risk and dependency — not
 * merely color", so a colour tie cannot decide the order:
 *
 *   1. severity, highest first;
 *   2. then the number of documented checks that did not meet their
 *      expectation as found — a finding that broke six checks outranks one
 *      that broke three;
 *   3. then the approved scenario order, which is the delivery dependency
 *      order: tenant isolation is the boundary every later scenario assumes.
 *
 * Every input is a recorded count or an approved ordinal. None is a judgement
 * made at render time.
 */
export const RANKING_BASIS =
  "Findings are ordered by severity first; then by how many documented checks did not meet their expectation in the configuration as found; then by the approved scenario order, which is also the dependency order — tenant isolation is the boundary the later scenarios assume.";

function scenarioOrder(id: string): number {
  return SCENARIOS.find((scenario) => scenario.slug === id)?.order ?? 99;
}

function rankFindings(findings: ReportFinding[]): ReportFinding[] {
  return [...findings]
    .sort(
      (a, b) =>
        severityRank(a.severity) - severityRank(b.severity) ||
        b.asFound.unmet - a.asFound.unmet ||
        scenarioOrder(a.id) - scenarioOrder(b.id),
    )
    .map((finding, index) => ({ ...finding, rank: index + 1 }));
}

/**
 * The representative check shown as reproduction evidence: the first check, in
 * recorded order, that did not meet its expectation as found. A finding exists
 * because something failed, so the evidence that opens it is that failure.
 *
 * If nothing failed there is nothing to select on, and the first recorded
 * check stands in — the finding's own state, which is rendered beside it, then
 * says plainly that no failure was reproduced.
 */
function representative<T extends { expectation_met: boolean }>(
  items: T[],
): T | null {
  return items.find((item) => !item.expectation_met) ?? items[0] ?? null;
}

function pillarOf(id: string): string {
  return SCENARIOS.find((scenario) => scenario.slug === id)?.pillar ?? id;
}

function documentedTestOf(id: string): string {
  return (
    SCENARIOS.find((scenario) => scenario.slug === id)?.documentedTest ?? ""
  );
}

function buildAuthorizationFindings(): ReportFinding[] {
  const asFoundCases = allRecordedCases(AS_FOUND);
  const afterFixCases = allRecordedCases(AFTER_FIX);

  return EVIDENCE_SCENARIO_IDS.map((id) => {
    const catalog = EVIDENCE_SCENARIOS[id];
    const mine = asFoundCases.filter((item) => item.scenario_id === id);
    const repeated = afterFixCases.filter((item) => item.scenario_id === id);

    const chosen = representative(mine);
    const paired = chosen
      ? repeated.filter((item) => item.case_id === chosen.case_id)
      : [];

    return {
      id,
      rank: 0,
      pillar: pillarOf(id),
      scenarioHref: `/scenarios/${id}`,
      finding: catalog.finding,
      severity: catalog.severity,
      severityBasis: catalog.severityBasis,
      impact: catalog.impact,
      affectedArea: catalog.affectedArea,
      boundaryLabel: "Tenant boundary",
      boundary: catalog.tenantBoundary,
      remediation: catalog.remediation,
      limitation: catalog.limitation,
      documentedTest: documentedTestOf(id),
      checkNoun: "documented test",
      asFound: outcomeOf(mine),
      afterFix: outcomeOf(repeated),
      evidence: {
        kind: "authorization" as const,
        before: chosen ? [chosen] : [],
        after: paired,
      },
      provenance: EVIDENCE_PROVENANCE_NOTE,
      representativeId: chosen?.case_id ?? "",
    };
  });
}

function buildReplayFindings(): ReportFinding[] {
  const asFoundSequences = allRecordedSequences(AS_FOUND);
  const afterFixSequences = allRecordedSequences(AFTER_FIX);
  const beforeHandler = recordedHandler(AS_FOUND);
  const afterHandler = recordedHandler(AFTER_FIX);

  return REPLAY_SCENARIO_IDS.map((id) => {
    const catalog = REPLAY_SCENARIOS[id];
    const mine = asFoundSequences.filter((item) => item.scenario_id === id);
    const repeated = afterFixSequences.filter(
      (item) => item.scenario_id === id,
    );

    const chosen = representative(mine);
    const paired = chosen
      ? repeated.filter((item) => item.sequence_id === chosen.sequence_id)
      : [];

    return {
      id,
      rank: 0,
      pillar: pillarOf(id),
      scenarioHref: `/scenarios/${id}`,
      finding: catalog.finding,
      severity: catalog.severity,
      severityBasis: catalog.severityBasis,
      impact: catalog.impact,
      affectedArea: catalog.affectedArea,
      boundaryLabel: "Boundary under test",
      boundary: catalog.boundary,
      remediation: catalog.remediation,
      limitation: catalog.limitation,
      documentedTest: documentedTestOf(id),
      checkNoun: "documented sequence",
      asFound: outcomeOf(mine),
      afterFix: outcomeOf(repeated),
      evidence: {
        kind: "replay" as const,
        before: chosen ? [chosen] : [],
        after: paired,
        // A sequence cannot be read without the configuration it ran against,
        // so an absent snapshot must not be substituted for. `beforeHandler`
        // is non-null in every committed transcript; the guard exists so a
        // damaged transcript surfaces as missing evidence rather than as a
        // crash or, worse, as a comparison against the wrong configuration.
        beforeHandler: beforeHandler as HandlerSnapshot,
        afterHandler,
      },
      provenance: REPLAY_PROVENANCE_NOTE,
      representativeId: chosen?.sequence_id ?? "",
    };
  }).filter((finding) => finding.evidence.kind !== "replay" || beforeHandler);
}

function totalOutcome(findings: ReportFinding[], mode: "asFound" | "afterFix") {
  return findings.reduce<CheckOutcome>(
    (running, finding) => {
      const item = finding[mode];
      return {
        total: running.total + item.total,
        unmet: running.unmet + item.unmet,
        met: running.met + item.met,
        state: worst([running.state, item.state]),
      };
    },
    { total: 0, unmet: 0, met: 0, state: "untested" },
  );
}

function countStates(rows: MatrixRow[]) {
  return [...summariseMatrix(rows).entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildReportModel(): ReportModel {
  const findings = rankFindings([
    ...buildAuthorizationFindings(),
    ...buildReplayFindings(),
  ]);

  const asFoundMatrix = buildCoverageMatrix(
    allRecordedCases(AS_FOUND),
    recordedRelations(AS_FOUND),
  );
  const afterFixMatrix = buildCoverageMatrix(
    allRecordedCases(AFTER_FIX),
    recordedRelations(AFTER_FIX),
  );

  const authorization = transcriptProvenance();
  const replay = replayTranscriptProvenance();
  const provenanceIsSingle =
    authorization.inputDigest === replay.inputDigest &&
    authorization.recordedAt === replay.recordedAt;

  // Cells that hold no result, with the recorded reason. MPS-ACC-005 requires
  // the buyer to be able to see why a check has none, and the report is where
  // "what was not tested" has to be legible without opening a scenario.
  const withoutResult = asFoundMatrix.flatMap((row) =>
    MATRIX_OPERATIONS.filter((operation) =>
      ["untested", "not-applicable"].includes(row.cells[operation].state),
    ).map((operation) => ({
      resource: row.resource,
      operation,
      state: row.cells[operation].state,
      reason: row.cells[operation].reason,
    })),
  );

  const rowSecurityChanges = asFoundMatrix
    .map((row) => ({
      resource: row.resource,
      asFound: row.rowSecurity,
      afterFix:
        afterFixMatrix.find((item) => item.resource === row.resource)
          ?.rowSecurity ?? row.rowSecurity,
    }))
    .filter((row) => row.asFound !== row.afterFix);

  return {
    provenanceIsSingle,
    recordedAt: authorization.recordedAt,
    engine: authorization.engine,
    inputDigest: authorization.inputDigest,
    findings,
    severityCounts: SEVERITIES.map((severity) => ({
      severity,
      count: findings.filter((finding) => finding.severity === severity).length,
    })).filter((entry) => entry.count > 0),
    checks: {
      asFound: totalOutcome(findings, "asFound"),
      afterFix: totalOutcome(findings, "afterFix"),
    },
    areas: findings.map((finding) => ({
      pillar: finding.pillar,
      severity: finding.severity,
      findings: 1,
      checks: finding.asFound.total,
      unmetAsFound: finding.asFound.unmet,
      unmetAfterFix: finding.afterFix.unmet,
      state: finding.asFound.state,
    })),
    matrix: {
      asFound: asFoundMatrix,
      afterFix: afterFixMatrix,
      asFoundCounts: countStates(asFoundMatrix),
      afterFixCounts: countStates(afterFixMatrix),
      withoutResult,
      rowSecurityChanges,
    },
  };
}

/*
 * The landing hero's evidence snapshot (MDS-REF-002 "Evidence snapshot
 * (synthetic data)"; MDS COMPOSITION-PROPOSAL landing shell section 1 —
 * "a compact evidence snapshot rather than decorative art").
 *
 * It shows one policy and the result the same documented test produced under
 * each configuration. Both the predicate and the result line are read from the
 * transcript, so the snapshot cannot show a policy the fixture does not carry
 * or a result the database did not give.
 *
 * Resolves the S1 deferral MTS-DEV-001, which left this region unpopulated
 * because no finding data existed before S2-S4. It is populated now from
 * recorded evidence, not from invented findings.
 */
export type PolicySnapshot = {
  caseId: string;
  caseTitle: string;
  resource: string;
  policyName: string;
  asFound: { predicate: string; result: string };
  afterFix: { predicate: string; result: string };
};

/** The documented test the hero snapshot opens on. */
const SNAPSHOT_CASE_ID = "RLS-005";

function policyPredicate(
  mode: EvidenceMode,
  resource: string,
  command: string,
): { name: string; predicate: string } | null {
  const relation = recordedRelations(mode).find(
    (item) => item.resource === resource,
  );
  const policy = relation?.policies.find((item) => item.command === command);
  if (!policy) return null;

  return {
    name: policy.name,
    predicate: policy.using ?? policy.with_check ?? "(no predicate recorded)",
  };
}

export function buildPolicySnapshot(): PolicySnapshot | null {
  const asFoundCase = allRecordedCases(AS_FOUND).find(
    (item) => item.case_id === SNAPSHOT_CASE_ID,
  );
  const afterFixCase = allRecordedCases(AFTER_FIX).find(
    (item) => item.case_id === SNAPSHOT_CASE_ID,
  );
  if (!asFoundCase || !afterFixCase) return null;

  const asFoundPolicy = policyPredicate(
    AS_FOUND,
    asFoundCase.resource,
    asFoundCase.operation,
  );
  const afterFixPolicy = policyPredicate(
    AFTER_FIX,
    afterFixCase.resource,
    afterFixCase.operation,
  );
  if (!asFoundPolicy || !afterFixPolicy) return null;

  return {
    caseId: asFoundCase.case_id,
    caseTitle: asFoundCase.title,
    resource: asFoundCase.resource,
    policyName: asFoundPolicy.name,
    asFound: {
      predicate: asFoundPolicy.predicate,
      result: resultLine(asFoundCase),
    },
    afterFix: {
      predicate: afterFixPolicy.predicate,
      result: resultLine(afterFixCase),
    },
  };
}
