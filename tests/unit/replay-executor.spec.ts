import { expect, test } from "@playwright/test";
import {
  runDocumentedSequences,
  selectReplayEvidence,
} from "@/lib/evidence/replay";
import transcriptJson from "@/lib/evidence/recorded/s3-replay-transcript.json";
import {
  DECISION_LABELS,
  REPLAY_SCENARIO_IDS,
  type DeliveryDecision,
  type RecordedSequence,
  type ReplayTranscript,
} from "@/lib/evidence/replay-types";
import { verdictLine } from "@/lib/evidence/replay-present";
import { EVIDENCE_MODES } from "@/lib/evidence/types";

const transcript = transcriptJson as unknown as ReplayTranscript;

/*
 * Trace: MPS-REQ-006/007/012/013, MPS-RULE-001/002/004,
 *        MPS-ACC-007/008/014/015.
 */

function sequence(mode: "vulnerable" | "remediated", id: string) {
  const found = transcript.runs[mode].find((item) => item.sequence_id === id);
  if (!found) throw new Error(`no recorded sequence ${id} in ${mode} mode`);
  return found;
}

test.describe("public input is allowlisted", () => {
  const unapproved = [
    // The S2 scenarios are not reachable through the replay executor, and vice
    // versa: two narrow allowlists rather than one wide one.
    { scenarioId: "authorization-and-rls", mode: "remediated" },
    { scenarioId: "storage-and-configuration", mode: "vulnerable" },
    { scenarioId: "../../etc/passwd", mode: "vulnerable" },
    { scenarioId: "webhook-integrity", mode: "bypass" },
    { scenarioId: "webhook-integrity", mode: "VULNERABLE" },
    { scenarioId: "webhook-integrity" },
    { mode: "vulnerable" },
    { scenarioId: ["webhook-integrity"], mode: "vulnerable" },
    {
      scenarioId: "webhook-integrity'; drop schema synthetic cascade;--",
      mode: "vulnerable",
    },
    // There is no parameter that could carry an event, endpoint, or signature.
    // These are rejected because the object does not match the schema at all.
    {
      scenarioId: "webhook-integrity",
      mode: "vulnerable",
      deliveryId: "del_nw2041_a",
    },
    { scenarioId: "webhook-integrity", mode: "vulnerable", payload: {} },
    "webhook-integrity",
    null,
    undefined,
    42,
    [],
  ];

  for (const input of unapproved) {
    test(`rejects ${JSON.stringify(input)}`, () => {
      const result = runDocumentedSequences(input);
      expect(result.status).toBe("rejected");
    });
  }

  test("accepts only the four approved scenario and configuration pairs", () => {
    for (const scenarioId of REPLAY_SCENARIO_IDS) {
      for (const mode of EVIDENCE_MODES) {
        const result = runDocumentedSequences({ scenarioId, mode });
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        expect(result.run.sequences.length).toBeGreaterThan(0);
        expect(
          result.run.sequences.every((item) => item.scenario_id === scenarioId),
        ).toBe(true);
        expect(result.run.handler.configuration.mode).toBe(mode);
      }
    }
  });

  test("an unknown extra key is rejected rather than ignored", () => {
    // Strict-by-default matters here: a request object that carries an extra
    // field is not a request this application understands, and silently
    // dropping it would make the boundary look wider than it is.
    const result = runDocumentedSequences({
      scenarioId: "webhook-integrity",
      mode: "vulnerable",
      endpoint: "https://example.invalid/hook",
    });
    expect(result.status).toBe("rejected");
  });
});

test.describe("missing evidence is unavailable, never a pass", () => {
  test("an empty transcript returns unavailable with a reason", () => {
    const empty = {
      ...transcript,
      runs: { vulnerable: [], remediated: [] },
    } as unknown as ReplayTranscript;

    const result = selectReplayEvidence(empty, {
      scenarioId: "webhook-integrity",
      mode: "vulnerable",
    });

    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") return;
    expect(result.reason).toContain("should be read as a result");
    expect(result.reason).not.toMatch(/pass|secure|safe/i);
  });

  test("a sequence with no handler snapshot is unavailable, not partial", () => {
    const noHandler = {
      ...transcript,
      handler: {},
    } as unknown as ReplayTranscript;

    const result = selectReplayEvidence(noHandler, {
      scenarioId: "webhook-integrity",
      mode: "remediated",
    });

    expect(result.status).toBe("unavailable");
  });
});

test.describe("the recorded evidence proves what the scenarios claim", () => {
  test("every documented sequence reaches its required end state under the remediated handler", () => {
    for (const item of transcript.runs.remediated) {
      expect(
        item.expectation_met,
        `${item.sequence_id} did not reach its required end state`,
      ).toBe(true);
      expect(item.checkpoints_held).toBe(true);
      expect(item.evidence_state).toBe("remediated");
    }
  });

  test("a replayed logical event does not create a duplicate commitment (MPS-ACC-007)", () => {
    const vulnerable = sequence("vulnerable", "WHK-001");
    const remediated = sequence("remediated", "WHK-001");

    // Two deliveries of one logical event.
    expect(new Set(vulnerable.steps.map((s) => s.event_id)).size).toBe(1);
    expect(new Set(vulnerable.steps.map((s) => s.delivery_id)).size).toBe(2);

    expect(vulnerable.observed_commitments).toBe(2);
    expect(vulnerable.observed_applied_cents).toBe(296000);
    expect(vulnerable.evidence_state).toBe("vulnerable");

    expect(remediated.observed_commitments).toBe(1);
    expect(remediated.observed_applied_cents).toBe(148000);
    expect(remediated.steps[1].decision).toBe("skipped_duplicate");
  });

  test("a forged event is refused only when the signature is verified", () => {
    const vulnerable = sequence("vulnerable", "WHK-002");
    const remediated = sequence("remediated", "WHK-002");

    expect(vulnerable.steps[0].signature_valid).toBe(false);
    expect(vulnerable.steps[0].decision).toBe("committed");
    expect(vulnerable.observed_commitments).toBe(1);

    expect(remediated.steps[0].decision).toBe("rejected_invalid_signature");
    expect(remediated.observed_commitments).toBe(0);
  });

  test("a superseded event does not overwrite newer state", () => {
    const vulnerable = sequence("vulnerable", "WHK-003");
    const remediated = sequence("remediated", "WHK-003");

    // The stale event carries the lower provider sequence.
    expect(remediated.steps[1].sequence_number).toBeLessThan(
      remediated.steps[0].sequence_number,
    );
    expect(remediated.steps[1].decision).toBe("rejected_out_of_order");
    expect(remediated.observed_commitments).toBe(1);
    expect(vulnerable.observed_commitments).toBe(2);
  });

  test("a failed delivery is recovered by the provider retry (MPS-ACC-008)", () => {
    const vulnerable = sequence("vulnerable", "REL-001");
    const remediated = sequence("remediated", "REL-001");

    // Vulnerable: marked processed, work lost, retry discarded as duplicate.
    expect(vulnerable.steps[0].decision).toBe("failed_after_marking_processed");
    expect(vulnerable.steps[1].decision).toBe("skipped_duplicate");
    expect(vulnerable.observed_commitments).toBe(0);

    // Remediated: the failure rolls back, and the retry commits exactly once.
    expect(remediated.steps[0].decision).toBe("failed_and_rolled_back");
    expect(remediated.steps[0].commitments_after).toBe(0);
    expect(remediated.steps[0].ledger_rows_after).toBe(0);
    expect(remediated.steps[1].decision).toBe("committed");
    expect(remediated.observed_commitments).toBe(1);
  });

  test("a multi-attempt outage still recovers", () => {
    const remediated = sequence("remediated", "REL-002");
    expect(remediated.steps).toHaveLength(4);
    expect(
      remediated.steps
        .slice(0, 3)
        .every((s) => s.decision === "failed_and_rolled_back"),
    ).toBe(true);
    expect(remediated.steps[3].decision).toBe("committed");
    expect(remediated.observed_commitments).toBe(1);

    expect(sequence("vulnerable", "REL-002").observed_commitments).toBe(0);
  });

  test("the legitimate paths keep working under both handlers", () => {
    // If a fix stops duplicates by stopping payments, that is not a fix.
    for (const id of ["WHK-004", "REL-004"]) {
      for (const mode of ["vulnerable", "remediated"] as const) {
        const item = sequence(mode, id);
        expect(item.expectation).toBe("allow");
        expect(
          item.expectation_met,
          `${id} did not hold under the ${mode} handler`,
        ).toBe(true);
      }
    }
  });

  test("a correct final count with a failed checkpoint is not reported as remediated", () => {
    /*
     * REL-003 is the reason step checkpoints exist. Under the vulnerable
     * handler the retry is lost AND the later manual replay is double-counted,
     * so the final count is accidentally correct. It must still be reported as
     * vulnerable, or the lab would show a broken handler as remediated.
     */
    const vulnerable = sequence("vulnerable", "REL-003");

    expect(vulnerable.observed_commitments).toBe(
      vulnerable.expected_commitments,
    );
    expect(vulnerable.observed_applied_cents).toBe(
      vulnerable.expected_applied_cents,
    );
    expect(vulnerable.checkpoints_held).toBe(false);
    expect(vulnerable.expectation_met).toBe(false);
    expect(vulnerable.evidence_state).toBe("vulnerable");
    expect(verdictLine(vulnerable)).toContain("cancelled out");
  });
});

test.describe("the evidence vocabulary cannot drift", () => {
  test("every recorded decision has a buyer-facing label", () => {
    const decisions = new Set<string>();
    for (const mode of EVIDENCE_MODES) {
      for (const item of transcript.runs[mode]) {
        for (const step of item.steps) decisions.add(step.decision);
      }
    }
    expect(decisions.size).toBeGreaterThan(0);
    for (const decision of decisions) {
      expect(
        DECISION_LABELS[decision as DeliveryDecision],
        `no label for recorded decision ${decision}`,
      ).toBeTruthy();
    }
  });

  test("a recorded sequence maps to exactly one canonical evidence state", () => {
    const allowed = new Set(["remediated", "vulnerable", "warning"]);
    for (const mode of EVIDENCE_MODES) {
      for (const item of transcript.runs[mode]) {
        expect(allowed.has(item.evidence_state)).toBe(true);
        // Met means remediated and nothing else; unmet is never remediated.
        expect(item.expectation_met).toBe(item.evidence_state === "remediated");
      }
    }
  });
});

test.describe("no secret or prohibited claim reaches the evidence", () => {
  const text = JSON.stringify(transcript);

  const forbidden = [
    /\bpassword\b/i,
    /\bsecret\b/i,
    /\bapi[-_ ]?key\b/i,
    /\bservice[-_ ]?role\b/i,
    /\bbearer\b/i,
    /eyJ[A-Za-z0-9_-]{10,}/,
    /\bsb[ps]_[A-Za-z0-9]{8,}/,
    /postgres(ql)?:\/\//,
    // The fixture's own invented signing string must never be published.
    /synthetic-signing-material-not-a-real-credential/,
  ];

  for (const pattern of forbidden) {
    test(`transcript contains nothing matching ${pattern}`, () => {
      expect(text).not.toMatch(pattern);
    });
  }

  const prohibited = [
    /\bsecure\b/i,
    /\bcertified\b/i,
    /\bcompliant\b/i,
    /\bguaranteed\b/i,
  ];
  for (const pattern of prohibited) {
    test(`transcript makes no ${pattern} claim`, () => {
      expect(text).not.toMatch(pattern);
    });
  }

  test("no recorded signature value is published", () => {
    // The log states whether a signature verified, which is the fact under
    // test; the digest itself is not part of the evidence and is not shipped.
    const sequences: RecordedSequence[] = [
      ...transcript.runs.vulnerable,
      ...transcript.runs.remediated,
    ];
    for (const item of sequences) {
      for (const step of item.steps) {
        expect(typeof step.signature_valid).toBe("boolean");
        expect(step).not.toHaveProperty("signature");
      }
    }
    expect(text).not.toMatch(/\b[0-9a-f]{32}\b/);
  });
});
