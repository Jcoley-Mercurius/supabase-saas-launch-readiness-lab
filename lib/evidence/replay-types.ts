/*
 * Shapes shared between the recorded replay transcript, the bounded replay
 * executor, and the replay evidence UI.
 *
 * Trace: MPS-REQ-006/007, MPS-ACC-007/008; MDS DESIGN-SYSTEM.md §9-10.
 *
 * As with the S2 types, these describe recorded evidence. They carry no
 * connection, credential, endpoint, or payload input: the only thing a caller
 * can choose is which approved scenario and which of the two documented
 * configurations to read.
 */

import type { EvidenceState } from "@/components/ui/status-indicator";
import type { EvidenceMode } from "@/lib/evidence/types";

/** The scenarios whose evidence S3 publishes. */
export const REPLAY_SCENARIO_IDS = [
  "webhook-integrity",
  "reliability-and-recovery",
] as const;
export type ReplayScenarioId = (typeof REPLAY_SCENARIO_IDS)[number];

/**
 * The named decisions the handler can reach. There is no "other": a decision
 * the handler cannot name is a decision the evidence cannot report.
 */
export type DeliveryDecision =
  | "committed"
  | "skipped_duplicate"
  | "rejected_invalid_signature"
  | "rejected_out_of_order"
  | "failed_after_marking_processed"
  | "failed_and_rolled_back";

/** One delivery attempt inside a documented sequence, as it actually ran. */
export type RecordedStep = {
  ordinal: number;
  label: string;
  note: string;
  delivery_id: string;
  event_id: string;
  invoice_number: string;
  sequence_number: number;
  amount_cents: number;
  attempt: number;
  signature_valid: boolean;
  decision: DeliveryDecision;
  detail: string;
  error_code: string | null;
  error_message: string | null;
  /**
   * The checkpoint this step declares, if any: how many commitments must exist
   * for the target invoice immediately after it. Null means the step makes no
   * claim of its own.
   */
  expected_commitments_after: number | null;
  checkpoint_met: boolean | null;
  ledger_rows_after: number;
  commitments_after: number;
  applied_cents_after: number;
};

export type LedgerEntry = {
  ledger_key: string;
  key_kind: "delivery_id" | "event_id";
  event_id: string;
  first_delivery_id: string;
  outcome: string;
};

export type CommitmentEntry = {
  id: string;
  invoice_number: string;
  event_id: string;
  delivery_id: string;
  attempt: number;
  amount_cents: number;
};

/** The four facts the handler branches on, read back from the database. */
export type HandlerConfiguration = {
  mode: EvidenceMode;
  verify_signature: boolean;
  ledger_key: "delivery_id" | "event_id";
  enforce_order: boolean;
  atomic_commit: boolean;
};

export type HandlerSnapshot = {
  configuration: HandlerConfiguration;
  ledger_constraint: string;
  signature_algorithm: string;
};

/** One documented sequence as PostgreSQL actually ran it. */
export type RecordedSequence = {
  sequence_id: string;
  scenario_id: string;
  ordinal: number;
  title: string;
  intent: string;
  consequence: string;
  target_invoice: string;
  expectation: "allow" | "deny";
  expectation_text: string;
  expected_commitments: number;
  expected_applied_cents: number;
  observed_commitments: number;
  observed_applied_cents: number;
  checkpoints_held: boolean;
  expectation_met: boolean;
  configuration: HandlerConfiguration;
  steps: RecordedStep[];
  ledger: LedgerEntry[];
  commitments: CommitmentEntry[];
  evidence_state: EvidenceState;
};

export type ReplayTranscript = {
  recorded_at: string;
  engine: {
    product: string;
    version: string;
    host: string;
    note: string;
  };
  input_digest: string;
  modes: readonly EvidenceMode[];
  runs: Record<EvidenceMode, RecordedSequence[]>;
  handler: Record<EvidenceMode, HandlerSnapshot>;
};

/** Buyer-facing wording for each decision, so the vocabulary cannot drift. */
export const DECISION_LABELS: Record<DeliveryDecision, string> = {
  committed: "Committed",
  skipped_duplicate: "Skipped as duplicate",
  rejected_invalid_signature: "Rejected — signature did not verify",
  rejected_out_of_order: "Rejected — superseded event",
  failed_after_marking_processed: "Failed after being marked processed",
  failed_and_rolled_back: "Failed and rolled back",
};
