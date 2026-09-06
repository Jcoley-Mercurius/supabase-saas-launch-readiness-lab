/*
 * Bounded evidence executor.
 *
 * Trace: MPS-REQ-003/004/005/012, MPS-RULE-001/002/003/004, MPS-ACC-014;
 *        MTS SECURITY-ARCHITECTURE "Vulnerable demonstration rule";
 *        MTS INTEGRATION-MANIFEST "Server-side execution preferred; only the
 *        qualified result crosses to the UI".
 *
 * The boundary, stated exactly:
 *
 *  - The only inputs are a scenario identifier and a mode, each checked
 *    against a closed allowlist by an explicit schema. Anything else is
 *    rejected before a single byte of evidence is read.
 *  - There is no parameter for a URL, project, database, credential, table,
 *    tenant, role, or query. None can be smuggled in, because none exists.
 *  - Nothing here opens a connection. The evidence was recorded offline
 *    against an isolated fixture; this module reads that recording. A public
 *    request therefore cannot reach a database at all, which is what makes it
 *    impossible for the deployed application to expose a reusable cross-tenant
 *    endpoint.
 *  - Absent evidence returns the canonical `unavailable` result. It is never
 *    silently converted into a pass (MPS-RULE-002, MPS-ACC-014).
 */

import { z } from "zod";
import { buildCoverageMatrix } from "@/lib/evidence/matrix";
import transcriptJson from "@/lib/evidence/recorded/s2-authorization-transcript.json";
import {
  EVIDENCE_MODES,
  EVIDENCE_SCENARIO_IDS,
  type EvidenceMode,
  type EvidenceScenarioId,
  type EvidenceTranscript,
  type MatrixRow,
  type RecordedCase,
  type RecordedRelation,
} from "@/lib/evidence/types";

const transcript = transcriptJson as unknown as EvidenceTranscript;

/*
 * The allowlist. `z.enum` over a closed tuple means an unapproved scenario or
 * mode cannot reach the read path — including through a direct POST to the
 * Server Action, which the Next.js documentation warns is always reachable
 * independently of the UI.
 */
export const RunRequestSchema = z.object({
  scenarioId: z.enum(EVIDENCE_SCENARIO_IDS),
  mode: z.enum(EVIDENCE_MODES),
});

export type RunRequest = z.infer<typeof RunRequestSchema>;

export type EvidenceRun = {
  scenarioId: EvidenceScenarioId;
  mode: EvidenceMode;
  /** Identifies this replay in the UI. Carries no meaning beyond ordering. */
  runId: string;
  replayedAt: string;
  recordedAt: string;
  engine: EvidenceTranscript["engine"];
  inputDigest: string;
  /** The documented tests belonging to this scenario. */
  cases: RecordedCase[];
  relations: RecordedRelation[];
  /**
   * The coverage matrix is derived from EVERY documented test recorded in
   * this mode, not only this scenario's. The matrix describes the fixture's
   * resources, and a resource proven in the neighbouring scenario is tested;
   * scoping the matrix to one scenario would report it as Untested and
   * understate what the evidence actually shows.
   */
  matrix: MatrixRow[];
};

export type EvidenceResult =
  | { status: "ok"; run: EvidenceRun }
  /** The request named something outside the approved allowlist. */
  | { status: "rejected"; reason: string }
  /** The request was valid but the recorded proof is missing. */
  | { status: "unavailable"; reason: string };

let replayCounter = 0;

/**
 * The whole decision, as a pure function of a transcript and a request.
 * Kept separate so the rejection and unavailable branches can be exercised
 * directly by tests rather than only when evidence happens to be missing.
 */
export function selectEvidence(
  source: EvidenceTranscript,
  input: unknown,
): EvidenceResult {
  const parsed = RunRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "rejected",
      reason:
        "That request does not name an approved scenario and documented mode. Only the published scenarios can be replayed.",
    };
  }

  const { scenarioId, mode } = parsed.data;
  const cases = (source.runs?.[mode] ?? []).filter(
    (recorded) => recorded.scenario_id === scenarioId,
  );

  if (cases.length === 0) {
    return {
      status: "unavailable",
      reason:
        "No recorded evidence exists for this scenario and mode in this build. Nothing here should be read as a result.",
    };
  }

  const relations = source.privileges?.[mode]?.relations ?? [];
  replayCounter += 1;

  return {
    status: "ok",
    run: {
      scenarioId,
      mode,
      runId: `${scenarioId}:${mode}:${replayCounter}`,
      replayedAt: new Date().toISOString(),
      recordedAt: source.recorded_at,
      engine: source.engine,
      inputDigest: source.input_digest,
      cases,
      relations,
      matrix: buildCoverageMatrix(source.runs?.[mode] ?? [], relations),
    },
  };
}

/** The bound entry point the application uses. */
export function runDocumentedTests(input: unknown): EvidenceResult {
  return selectEvidence(transcript, input);
}

/** The full recorded case list for a mode, used to build the coverage matrix. */
export function allRecordedCases(mode: EvidenceMode): RecordedCase[] {
  return transcript.runs?.[mode] ?? [];
}

export function recordedRelations(mode: EvidenceMode): RecordedRelation[] {
  return transcript.privileges?.[mode]?.relations ?? [];
}

export function transcriptProvenance() {
  return {
    recordedAt: transcript.recorded_at,
    engine: transcript.engine,
    inputDigest: transcript.input_digest,
  };
}
