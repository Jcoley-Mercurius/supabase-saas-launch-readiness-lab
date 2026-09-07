import { expect, test } from "@playwright/test";
import {
  allRecordedCases,
  recordedRelations,
  runDocumentedTests,
  selectEvidence,
} from "@/lib/evidence/executor";
import { buildCoverageMatrix, MATRIX_OPERATIONS } from "@/lib/evidence/matrix";
import transcriptJson from "@/lib/evidence/recorded/s2-authorization-transcript.json";
import {
  EVIDENCE_MODES,
  EVIDENCE_SCENARIO_IDS,
  type EvidenceTranscript,
} from "@/lib/evidence/types";

const transcript = transcriptJson as unknown as EvidenceTranscript;

/*
 * Trace: MPS-REQ-003/004/005/012, MPS-RULE-001/002/007,
 *        MPS-ACC-003/004/005/006/014/015.
 */

test.describe("public input is allowlisted", () => {
  const unapproved = [
    { scenarioId: "webhook-integrity", mode: "remediated" },
    { scenarioId: "reliability-and-recovery", mode: "vulnerable" },
    { scenarioId: "../../etc/passwd", mode: "vulnerable" },
    { scenarioId: "authorization-and-rls", mode: "bypass" },
    { scenarioId: "authorization-and-rls", mode: "VULNERABLE" },
    { scenarioId: "authorization-and-rls" },
    { mode: "vulnerable" },
    { scenarioId: ["authorization-and-rls"], mode: "vulnerable" },
    {
      scenarioId: "authorization-and-rls'; drop schema synthetic cascade;--",
      mode: "vulnerable",
    },
    "authorization-and-rls",
    null,
    undefined,
    42,
    [],
  ];

  for (const input of unapproved) {
    test(`rejects ${JSON.stringify(input)}`, () => {
      const result = runDocumentedTests(input);
      expect(result.status).toBe("rejected");
    });
  }

  test("accepts only the four approved scenario and mode pairs", () => {
    for (const scenarioId of EVIDENCE_SCENARIO_IDS) {
      for (const mode of EVIDENCE_MODES) {
        const result = runDocumentedTests({ scenarioId, mode });
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        expect(result.run.cases.length).toBeGreaterThan(0);
        expect(
          result.run.cases.every((item) => item.scenario_id === scenarioId),
        ).toBe(true);
      }
    }
  });

  test("a valid request with no recorded proof is unavailable, never a pass", () => {
    const empty: EvidenceTranscript = {
      ...transcript,
      runs: { vulnerable: [], remediated: [] },
    };
    const result = selectEvidence(empty, {
      scenarioId: "authorization-and-rls",
      mode: "remediated",
    });
    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") return;
    expect(result.reason).not.toMatch(/pass|secure|certified|compliant/i);
  });
});

test.describe("recorded evidence is truthful", () => {
  test("the vulnerable mode reproduces failures the remediated mode constrains", () => {
    const before = allRecordedCases("vulnerable");
    const after = allRecordedCases("remediated");

    const brokenBefore = before.filter(
      (item) => item.evidence_state === "vulnerable",
    );
    expect(brokenBefore.length).toBeGreaterThan(0);

    for (const item of brokenBefore) {
      const repeated = after.find((other) => other.case_id === item.case_id);
      expect(
        repeated,
        `${item.case_id} missing from the remediated run`,
      ).toBeTruthy();
      expect(
        repeated?.evidence_state,
        `${item.case_id} did not transition to remediated`,
      ).toBe("remediated");
    }
  });

  test("every deny case that reported remediated really returned nothing", () => {
    for (const mode of EVIDENCE_MODES) {
      for (const item of allRecordedCases(mode)) {
        if (
          item.expectation === "deny" &&
          item.evidence_state === "remediated"
        ) {
          expect(item.row_count, `${mode}/${item.case_id}`).toBe(0);
          expect(
            ["no_rows", "error"].includes(item.outcome),
            `${mode}/${item.case_id} outcome ${item.outcome}`,
          ).toBe(true);
        }
      }
    }
  });

  test("allow paths still work after remediation", () => {
    const allowCases = allRecordedCases("remediated").filter(
      (item) => item.expectation === "allow",
    );
    expect(allowCases.length).toBeGreaterThan(0);
    for (const item of allowCases) {
      expect(item.row_count, item.case_id).toBeGreaterThan(0);
      expect(item.evidence_state, item.case_id).toBe("remediated");
    }
  });
});

test.describe("the coverage matrix cannot imply a pass", () => {
  for (const mode of EVIDENCE_MODES) {
    test(`${mode} matrix classifies every cell with a reason`, () => {
      const rows = buildCoverageMatrix(
        allRecordedCases(mode),
        recordedRelations(mode),
      );
      expect(rows.length).toBe(4);

      for (const row of rows) {
        for (const operation of MATRIX_OPERATIONS) {
          const cell = row.cells[operation];
          expect(
            cell.reason.length,
            `${row.resource}.${operation}`,
          ).toBeGreaterThan(0);

          // A result state is only reachable from a documented test.
          if (
            cell.state === "remediated" ||
            cell.state === "vulnerable" ||
            cell.state === "warning"
          ) {
            expect(
              cell.caseIds.length,
              `${row.resource}.${operation}`,
            ).toBeGreaterThan(0);
          }
          // Untested and not-applicable never carry a case.
          if (cell.state === "untested" || cell.state === "not-applicable") {
            expect(cell.caseIds.length, `${row.resource}.${operation}`).toBe(0);
          }
        }
      }
    });
  }

  test("the matrix contains a genuinely untested and a genuinely not-applicable cell", () => {
    const rows = buildCoverageMatrix(
      allRecordedCases("remediated"),
      recordedRelations("remediated"),
    );
    const states = rows.flatMap((row) =>
      MATRIX_OPERATIONS.map((operation) => row.cells[operation].state),
    );
    expect(states).toContain("untested");
    expect(states).toContain("not-applicable");
  });
});

test.describe("no secret or prohibited claim reaches the evidence", () => {
  const serialised = JSON.stringify(transcript);

  const forbiddenSecrets = [
    /\bpassword\b/i,
    /\bapi[-_ ]?key\b/i,
    /\bservice[-_ ]?role\b/i,
    /\bbearer\b/i,
    /eyJ[A-Za-z0-9_-]{10,}/,
    /\bsb[ps]_[A-Za-z0-9]{8,}/,
    /postgres(ql)?:\/\//,
  ];

  for (const pattern of forbiddenSecrets) {
    test(`transcript contains nothing matching ${pattern}`, () => {
      expect(serialised).not.toMatch(pattern);
    });
  }

  const prohibitedClaims = [
    /\bcertified\b/i,
    /\bcompliant\b/i,
    /\bguaranteed\b/i,
  ];
  for (const pattern of prohibitedClaims) {
    test(`transcript makes no ${pattern} claim`, () => {
      expect(serialised).not.toMatch(pattern);
    });
  }
});
