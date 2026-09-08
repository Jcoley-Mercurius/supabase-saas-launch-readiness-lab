import { expect, test } from "@playwright/test";
import s2Json from "@/lib/evidence/recorded/s2-authorization-transcript.json";
import s3Json from "@/lib/evidence/recorded/s3-replay-transcript.json";
import * as reportContent from "@/lib/content/report";
import {
  AFTER_FIX,
  AS_FOUND,
  buildPolicySnapshot,
  buildReportModel,
} from "@/lib/evidence/report";
import type { EvidenceTranscript } from "@/lib/evidence/types";
import type { ReplayTranscript } from "@/lib/evidence/replay-types";

/*
 * Trace: MPS-REQ-008 (the seven parts every finding must carry), MPS-REQ-009,
 *        MPS-RULE-002/007, MPS-ACC-005/009/010.
 *
 * The point of these tests is that the report cannot state something the
 * transcripts do not support. So every expected number below is recomputed
 * from the transcript JSON directly, by different code than the model uses. A
 * test that asked the model to confirm its own arithmetic would prove nothing.
 */

const s2 = s2Json as unknown as EvidenceTranscript;
const s3 = s3Json as unknown as ReplayTranscript;

const model = buildReportModel();

function unmetIn(mode: "vulnerable" | "remediated") {
  return (
    s2.runs[mode].filter((item) => !item.expectation_met).length +
    s3.runs[mode].filter((item) => !item.expectation_met).length
  );
}

function totalIn(mode: "vulnerable" | "remediated") {
  return s2.runs[mode].length + s3.runs[mode].length;
}

test.describe("the report is derived from the transcripts", () => {
  test("check totals match the recorded runs exactly", () => {
    expect(model.checks.asFound.total).toBe(totalIn(AS_FOUND));
    expect(model.checks.asFound.unmet).toBe(unmetIn(AS_FOUND));
    expect(model.checks.afterFix.total).toBe(totalIn(AFTER_FIX));
    expect(model.checks.afterFix.unmet).toBe(unmetIn(AFTER_FIX));
  });

  test("every documented area appears exactly once", () => {
    const ids = model.findings.map((finding) => finding.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("authorization-and-rls");
    expect(ids).toContain("storage-and-configuration");
    expect(ids).toContain("webhook-integrity");
    expect(ids).toContain("reliability-and-recovery");
  });

  test("per-finding counts match the recorded runs", () => {
    for (const finding of model.findings) {
      const recorded = [...s2.runs[AS_FOUND], ...s3.runs[AS_FOUND]].filter(
        (item) => item.scenario_id === finding.id,
      );
      expect(finding.asFound.total).toBe(recorded.length);
      expect(finding.asFound.unmet).toBe(
        recorded.filter((item) => !item.expectation_met).length,
      );
      expect(finding.asFound.met + finding.asFound.unmet).toBe(
        finding.asFound.total,
      );
    }
  });

  test("the coverage matrix classifies all sixteen cells and none is blank", () => {
    const counted = model.matrix.asFoundCounts.reduce(
      (total, entry) => total + entry.count,
      0,
    );
    expect(counted).toBe(16);
    // A cell with no result must say why it has none (MPS-ACC-005).
    for (const cell of model.matrix.withoutResult) {
      expect(["untested", "not-applicable"]).toContain(cell.state);
      expect(cell.reason.length).toBeGreaterThan(20);
    }
  });

  test("applying a fix does not invent a check that was never written", () => {
    const without = (
      counts: Array<{ state: string; count: number }>,
      state: string,
    ) => counts.find((entry) => entry.state === state)?.count ?? 0;

    for (const state of ["untested", "not-applicable"]) {
      expect(without(model.matrix.asFoundCounts, state)).toBe(
        without(model.matrix.afterFixCounts, state),
      );
    }
  });
});

test.describe("ordering is computed, not chosen", () => {
  test("ranks are contiguous and start at one", () => {
    expect(model.findings.map((finding) => finding.rank)).toEqual(
      model.findings.map((_, index) => index + 1),
    );
  });

  test("no finding outranks one with a higher severity or more unmet checks", () => {
    const order = ["High", "Medium", "Low"];
    for (let i = 1; i < model.findings.length; i += 1) {
      const previous = model.findings[i - 1];
      const current = model.findings[i];
      const bySeverity =
        order.indexOf(previous.severity) - order.indexOf(current.severity);
      expect(bySeverity).toBeLessThanOrEqual(0);
      if (bySeverity === 0) {
        expect(previous.asFound.unmet).toBeGreaterThanOrEqual(
          current.asFound.unmet,
        );
      }
    }
  });
});

test.describe("every finding carries the seven parts MPS-REQ-008 requires", () => {
  test("nothing required is empty", () => {
    for (const finding of model.findings) {
      // severity, affected boundary, impact, remediation direction, limitation
      expect(finding.severity).toBeTruthy();
      expect(finding.severityBasis.length).toBeGreaterThan(20);
      expect(finding.affectedArea.length).toBeGreaterThan(5);
      expect(finding.boundary.length).toBeGreaterThan(3);
      expect(finding.boundaryLabel.length).toBeGreaterThan(3);
      expect(finding.impact.length).toBeGreaterThan(20);
      expect(finding.remediation.length).toBeGreaterThan(0);
      expect(finding.limitation.length).toBeGreaterThan(40);

      // reproduction evidence, and the before/after status of the same check
      if (finding.evidence.kind === "authorization") {
        expect(finding.evidence.before.length).toBe(1);
        expect(finding.evidence.after.length).toBe(1);
        expect(finding.evidence.after[0].case_id).toBe(
          finding.evidence.before[0].case_id,
        );
      } else {
        expect(finding.evidence.before.length).toBe(1);
        expect(finding.evidence.after.length).toBe(1);
        expect(finding.evidence.after[0].sequence_id).toBe(
          finding.evidence.before[0].sequence_id,
        );
        expect(finding.evidence.beforeHandler).toBeTruthy();
      }
      expect(finding.representativeId).toBeTruthy();
    }
  });

  test("the representative check is one that did not meet its expectation", () => {
    for (const finding of model.findings) {
      const before =
        finding.evidence.kind === "authorization"
          ? finding.evidence.before[0]
          : finding.evidence.before[0];
      expect(before.expectation_met).toBe(false);
    }
  });
});

test.describe("the hero snapshot shows recorded policy, not prose", () => {
  test("both predicates come from the transcript and differ", () => {
    const snapshot = buildPolicySnapshot();
    expect(snapshot).not.toBeNull();
    if (!snapshot) return;

    const relation = s2.privileges[AS_FOUND].relations.find(
      (item) => item.resource === snapshot.resource,
    );
    const policy = relation?.policies.find(
      (item) => item.name === snapshot.policyName,
    );
    expect(policy?.using).toBe(snapshot.asFound.predicate);
    expect(snapshot.asFound.predicate).not.toBe(snapshot.afterFix.predicate);
    expect(snapshot.asFound.result).not.toBe(snapshot.afterFix.result);
  });
});

test.describe("prohibited vocabulary never reaches the report", () => {
  /*
   * MDS DESIGN-SYSTEM.md §9 and AGENTS.md: "secure", "certified", "compliant",
   * "guaranteed", and an unqualified "passed" are prohibited. The check runs
   * over the authored narrative AND over every derived string the report
   * renders, so neither layer can introduce one.
   */
  const banned = [
    /\bsecure\b/i,
    /\bcertified\b/i,
    /\bcompliant\b/i,
    /\bguaranteed\b/i,
    /\bpassed\b/i,
  ];

  function collect(value: unknown, into: string[]) {
    if (typeof value === "string") into.push(value);
    else if (Array.isArray(value)) value.forEach((item) => collect(item, into));
    else if (value && typeof value === "object")
      Object.values(value).forEach((item) => collect(item, into));
  }

  test("the authored narrative is clean", () => {
    const strings: string[] = [];
    collect(reportContent, strings);
    expect(strings.length).toBeGreaterThan(30);
    for (const value of strings) {
      for (const pattern of banned) {
        expect(value, `"${value}"`).not.toMatch(pattern);
      }
    }
  });

  test("the derived model is clean", () => {
    const strings: string[] = [];
    // The recorded excerpts are the database's own words and are shown
    // verbatim; the framing the report wraps them in is what is checked here.
    for (const finding of model.findings) {
      collect(
        {
          finding: finding.finding,
          severityBasis: finding.severityBasis,
          impact: finding.impact,
          affectedArea: finding.affectedArea,
          remediation: finding.remediation,
          limitation: finding.limitation,
        },
        strings,
      );
    }
    collect(
      model.matrix.withoutResult.map((cell) => cell.reason),
      strings,
    );
    for (const value of strings) {
      for (const pattern of banned) {
        expect(value, `"${value}"`).not.toMatch(pattern);
      }
    }
  });
});
