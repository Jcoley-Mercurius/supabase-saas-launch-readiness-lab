/*
 * RLS coverage matrix derivation.
 *
 * Trace: MPS-ACC-005 — "each displayed check is classified as passing,
 *        failing, not tested, or not applicable, and no missing check is
 *        implied to have passed"; MDS COMPONENTS-PROPOSAL "RLS coverage
 *        matrix"; MDS-REF-006.
 *
 * The matrix is derived, never authored. A cell can only reach a result state
 * if a documented test produced it. Everything else falls through to:
 *
 *   not applicable — the operation is not granted to any application role, so
 *                    no policy is consulted. The grant state is the reason.
 *   untested       — the operation is reachable but no documented test covers
 *                    it. This is the honest default and it never means pass.
 */

import type { EvidenceState } from "@/components/ui/status-indicator";
import type {
  MatrixCell,
  MatrixRow,
  RecordedCase,
  RecordedRelation,
} from "@/lib/evidence/types";

export const MATRIX_OPERATIONS = [
  "select",
  "insert",
  "update",
  "delete",
] as const;
export type MatrixOperation = (typeof MATRIX_OPERATIONS)[number];

export const MATRIX_RESOURCES = [
  "synthetic.profiles",
  "synthetic.org_members",
  "synthetic.invoices",
  "synthetic.storage_objects",
] as const;

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

const APPLICATION_ROLES = ["anon", "authenticated"];

export function buildCoverageMatrix(
  cases: RecordedCase[],
  relations: RecordedRelation[],
): MatrixRow[] {
  return MATRIX_RESOURCES.map((resource) => {
    const relation = relations.find((item) => item.resource === resource);

    const cells = {} as Record<MatrixOperation, MatrixCell>;

    for (const operation of MATRIX_OPERATIONS) {
      const matching = cases.filter(
        (recorded) =>
          recorded.resource === resource && recorded.operation === operation,
      );

      if (matching.length > 0) {
        const state = worst(matching.map((item) => item.evidence_state));
        cells[operation] = {
          state,
          reason: matching
            .map((item) => `${item.case_id} — ${item.title}`)
            .join("; "),
          caseIds: matching.map((item) => item.case_id),
        };
        continue;
      }

      const granted = (relation?.grants ?? []).filter(
        (grant) =>
          grant.privilege === operation &&
          APPLICATION_ROLES.includes(grant.grantee),
      );

      if (granted.length === 0) {
        cells[operation] = {
          state: "not-applicable",
          reason: `No ${operation} privilege is granted to an application role on ${resource}, so no policy is consulted for this operation.`,
          caseIds: [],
        };
        continue;
      }

      cells[operation] = {
        state: "untested",
        reason: `${operation} is granted to ${granted
          .map((grant) => grant.grantee)
          .join(
            " and ",
          )} on ${resource}, but no documented test in this build covers it. No result exists.`,
        caseIds: [],
      };
    }

    return {
      resource,
      rowSecurity: relation?.row_security ?? false,
      cells,
    };
  });
}

/** Counts by state, for the summary line above the matrix. */
export function summariseMatrix(rows: MatrixRow[]) {
  const counts = new Map<EvidenceState, number>();
  for (const row of rows) {
    for (const operation of MATRIX_OPERATIONS) {
      const { state } = row.cells[operation];
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }
  }
  return counts;
}
