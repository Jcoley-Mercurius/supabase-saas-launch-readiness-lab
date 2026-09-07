/*
 * Bounded replay evidence executor.
 *
 * Trace: MPS-REQ-006/007/012/013, MPS-RULE-001/002/004, MPS-ACC-007/008/014;
 *        MTS SECURITY-ARCHITECTURE "Vulnerable demonstration rule" and
 *        "handle replay, ordering, retries, and idempotency";
 *        MTS INTEGRATION-MANIFEST "Server-side execution preferred; only the
 *        qualified result crosses to the UI".
 *
 * The boundary is the same one the S2 executor draws, and it matters more
 * here, because this scenario is about a webhook endpoint:
 *
 *  - The only inputs are a scenario identifier and a documented configuration,
 *    each checked against a closed allowlist by an explicit schema.
 *  - There is no parameter for a URL, endpoint, payload, signature, event,
 *    delivery, amount, or tenant. None can be smuggled in, because none
 *    exists. In particular, this application publishes NO endpoint that
 *    accepts an event body from anyone.
 *  - Nothing here opens a connection or receives a delivery. The evidence was
 *    recorded offline against an isolated fixture; this module reads that
 *    recording.
 *  - Absent evidence returns the canonical `unavailable` result and is never
 *    silently converted into a pass (MPS-RULE-002, MPS-ACC-014).
 *
 * It is deliberately a separate module from the S2 executor rather than a
 * widened one: the two transcripts have different shapes, and one allowlist
 * that admitted every scenario in the product would be a larger surface than
 * either slice needs.
 */

import { z } from "zod";
import transcriptJson from "@/lib/evidence/recorded/s3-replay-transcript.json";
import { EVIDENCE_MODES, type EvidenceMode } from "@/lib/evidence/types";
import {
  REPLAY_SCENARIO_IDS,
  type HandlerSnapshot,
  type RecordedSequence,
  type ReplayScenarioId,
  type ReplayTranscript,
} from "@/lib/evidence/replay-types";

const transcript = transcriptJson as unknown as ReplayTranscript;

/*
 * The allowlist. `z.enum` over a closed tuple means an unapproved scenario or
 * configuration cannot reach the read path — including through a direct POST
 * to the Server Action, which the Next.js documentation warns is always
 * reachable independently of the UI.
 *
 * `strictObject`, not `object`: an ordinary zod object ignores unknown keys, so
 * a request carrying `endpoint`, `payload`, or `signature` would be silently
 * stripped and served as if it had never asked. Nothing reads those keys, so
 * stripping them is not itself a vulnerability — but this slice's claim is
 * that the request surface is exactly two enumerated fields, and a request
 * that carries anything else is not a request this application understands.
 * Refusing it says so; ignoring it merely behaves well by accident.
 */
export const ReplayRequestSchema = z.strictObject({
  scenarioId: z.enum(REPLAY_SCENARIO_IDS),
  mode: z.enum(EVIDENCE_MODES),
});

export type ReplayRequest = z.infer<typeof ReplayRequestSchema>;

export type ReplayRun = {
  scenarioId: ReplayScenarioId;
  mode: EvidenceMode;
  /** Identifies this replay in the UI. Carries no meaning beyond ordering. */
  runId: string;
  replayedAt: string;
  recordedAt: string;
  engine: ReplayTranscript["engine"];
  inputDigest: string;
  /** The documented sequences belonging to this scenario. */
  sequences: RecordedSequence[];
  /** The handler configuration those sequences ran against. */
  handler: HandlerSnapshot;
};

export type ReplayResult =
  | { status: "ok"; run: ReplayRun }
  /** The request named something outside the approved allowlist. */
  | { status: "rejected"; reason: string }
  /** The request was valid but the recorded proof is missing. */
  | { status: "unavailable"; reason: string };

let replayCounter = 0;

/**
 * The whole decision, as a pure function of a transcript and a request, so the
 * rejection and unavailable branches can be exercised directly by tests rather
 * than only when evidence happens to be missing.
 */
export function selectReplayEvidence(
  source: ReplayTranscript,
  input: unknown,
): ReplayResult {
  const parsed = ReplayRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "rejected",
      reason:
        "That request does not name an approved scenario and documented configuration. Only the published scenarios can be replayed.",
    };
  }

  const { scenarioId, mode } = parsed.data;
  const sequences = (source.runs?.[mode] ?? []).filter(
    (recorded) => recorded.scenario_id === scenarioId,
  );
  const handler = source.handler?.[mode];

  // The handler configuration is part of the evidence, not decoration: a
  // sequence without the configuration it ran against cannot be shown as a
  // before/after result, so a missing snapshot is unavailable, not partial.
  if (sequences.length === 0 || !handler) {
    return {
      status: "unavailable",
      reason:
        "No recorded evidence exists for this scenario and configuration in this build. Nothing here should be read as a result.",
    };
  }

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
      sequences,
      handler,
    },
  };
}

/** The bound entry point the application uses. */
export function runDocumentedSequences(input: unknown): ReplayResult {
  return selectReplayEvidence(transcript, input);
}

export function replayTranscriptProvenance() {
  return {
    recordedAt: transcript.recorded_at,
    engine: transcript.engine,
    inputDigest: transcript.input_digest,
  };
}
