/*
 * Shapes shared between the recorded transcript, the bounded executor, and the
 * evidence UI.
 *
 * Trace: MPS-REQ-004, MPS-ACC-003/004/005/006; MDS DESIGN-SYSTEM.md §9-10.
 *
 * These types describe recorded evidence. They deliberately carry no
 * connection, credential, or query input: the only thing a caller can choose
 * is which approved scenario and which of the two documented modes to read.
 */

import type { EvidenceState } from "@/components/ui/status-indicator";

/** The two documented policy modes. There is no third mode. */
export const EVIDENCE_MODES = ["vulnerable", "remediated"] as const;
export type EvidenceMode = (typeof EVIDENCE_MODES)[number];

/** The scenarios whose evidence S2 publishes. */
export const EVIDENCE_SCENARIO_IDS = [
  "authorization-and-rls",
  "storage-and-configuration",
] as const;
export type EvidenceScenarioId = (typeof EVIDENCE_SCENARIO_IDS)[number];

export type RecordedOperation =
  "select" | "insert" | "update" | "delete" | "configuration";

/** One documented test as PostgreSQL actually answered it. */
export type RecordedCase = {
  case_id: string;
  scenario_id: string;
  resource: string;
  operation: RecordedOperation;
  actor_key: string;
  actor_label: string;
  db_role: string;
  title: string;
  intent: string;
  consequence: string;
  sql_text: string;
  verify_sql: string | null;
  expectation: "allow" | "deny";
  outcome: "rows_returned" | "rows_written" | "no_rows" | "error";
  row_count: number;
  rows: Array<Record<string, unknown>>;
  verify_rows: Array<Record<string, unknown>> | null;
  error_code: string | null;
  error_message: string | null;
  error_detail: string | null;
  expectation_met: boolean;
  evidence_state: EvidenceState;
};

export type RecordedPolicy = {
  name: string;
  command: string;
  using: string | null;
  with_check: string | null;
};

export type RecordedRelation = {
  resource: string;
  row_security: boolean;
  policies: RecordedPolicy[];
  grants: Array<{ grantee: string; privilege: string }>;
};

export type EvidenceTranscript = {
  recorded_at: string;
  engine: {
    product: string;
    version: string;
    host: string;
    note: string;
  };
  input_digest: string;
  modes: readonly EvidenceMode[];
  runs: Record<EvidenceMode, RecordedCase[]>;
  privileges: Record<EvidenceMode, { relations: RecordedRelation[] }>;
};

/** One cell of the RLS coverage matrix. */
export type MatrixCell = {
  state: EvidenceState;
  /** Why the cell holds this state. Never optional: a bare state is not evidence. */
  reason: string;
  caseIds: string[];
};

export type MatrixRow = {
  resource: string;
  rowSecurity: boolean;
  cells: Record<"select" | "insert" | "update" | "delete", MatrixCell>;
};
