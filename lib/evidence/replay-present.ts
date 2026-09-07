/*
 * Turns a recorded delivery sequence into the buyer-facing excerpt tabs.
 *
 * Trace: MPS-REQ-006/007 ("in buyer-readable language"), MPS-RULE-002/007;
 *        MDS COMPONENTS-PROPOSAL "Code or log excerpt"; MDS-REF-006.
 *
 * Formatting only. Every value shown is read from the recorded transcript, so
 * this module cannot state a result the handler did not produce. The closing
 * verdict line is derived from the recorded counts, never asserted.
 */

import type { ExcerptTab } from "@/components/evidence/code-excerpt";
import {
  DECISION_LABELS,
  type HandlerSnapshot,
  type RecordedSequence,
  type RecordedStep,
} from "@/lib/evidence/replay-types";

/** Cents to a plain amount. No currency symbol: the fixture is unit-only. */
export function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2)} USD`;
}

/** A psql-style fixed-width table, so the excerpt reads like a real session. */
function renderRows(rows: Array<Record<string, unknown>>): string[] {
  if (rows.length === 0) return ["(0 rows)"];

  const columns = Object.keys(rows[0]);
  const cells = rows.map((row) =>
    columns.map((column) => String(row[column] ?? "null")),
  );
  const widths = columns.map((column, index) =>
    Math.max(column.length, ...cells.map((row) => row[index].length)),
  );
  const pad = (value: string, index: number) => value.padEnd(widths[index]);

  return [
    columns.map(pad).join(" | "),
    widths.map((width) => "-".repeat(width)).join("-+-"),
    ...cells.map((row) => row.map(pad).join(" | ")),
    `(${rows.length} ${rows.length === 1 ? "row" : "rows"})`,
  ];
}

/** The one-line verdict, derived from what was recorded. */
export function verdictLine(recorded: RecordedSequence): string {
  const { observed_commitments, expected_commitments } = recorded;

  if (recorded.expectation_met) {
    return `Result: ${observed_commitments} commitment(s) totalling ${formatCents(
      recorded.observed_applied_cents,
    )} for ${recorded.target_invoice}, which is what this sequence requires.`;
  }

  if (observed_commitments > expected_commitments) {
    return `Result: ${observed_commitments} commitment(s) totalling ${formatCents(
      recorded.observed_applied_cents,
    )} for ${recorded.target_invoice}, where ${expected_commitments} totalling ${formatCents(
      recorded.expected_applied_cents,
    )} was required — the same work was committed more than once.`;
  }

  if (observed_commitments < expected_commitments) {
    return `Result: ${observed_commitments} commitment(s) for ${recorded.target_invoice}, where ${expected_commitments} totalling ${formatCents(
      recorded.expected_applied_cents,
    )} was required — the work was lost rather than duplicated.`;
  }

  // Counts agree but a step checkpoint did not hold: the end state was reached
  // by compensating errors rather than by correct handling, and reporting it as
  // met would be the single most misleading thing this module could do.
  return `Result: the final count for ${recorded.target_invoice} matches, but a step checkpoint did not hold — the end state was reached by errors that cancelled out, not by correct handling.`;
}

function stepLines(step: RecordedStep): string[] {
  const lines = [
    `[step ${step.ordinal}] ${step.label}`,
    `  delivery ${step.delivery_id} · attempt ${step.attempt} · logical event ${step.event_id}`,
    `  invoice ${step.invoice_number} · provider sequence ${step.sequence_number} · ${formatCents(step.amount_cents)}`,
    `  signature ${step.signature_valid ? "verifies against the payload" : "DOES NOT verify against the payload"}`,
    `  -> ${DECISION_LABELS[step.decision]}`,
    `     ${step.detail}`,
  ];

  if (step.error_code) {
    lines.push(`     SQLSTATE ${step.error_code}: ${step.error_message}`);
  }

  lines.push(
    `  state after: ${step.commitments_after} commitment(s), ${formatCents(
      step.applied_cents_after,
    )} applied, ${step.ledger_rows_after} ledger row(s)`,
  );

  if (step.expected_commitments_after !== null) {
    lines.push(
      `  checkpoint: ${step.expected_commitments_after} commitment(s) required here — ${
        step.checkpoint_met ? "held" : "DID NOT HOLD"
      }`,
    );
  }

  lines.push("");
  return lines;
}

function configurationLines(handler: HandlerSnapshot): string[] {
  const c = handler.configuration;
  return [
    `-- Handler configuration recorded for the ${c.mode} run.`,
    "-- Read back from the database; the handler branched on this exact row.",
    "",
    `verify_signature = ${c.verify_signature}`,
    `  ${
      c.verify_signature
        ? "The signature is recomputed and a delivery that fails it is refused."
        : "The signature is not checked, so any caller reaching the endpoint is trusted."
    }`,
    "",
    `ledger_key       = ${c.ledger_key}`,
    `  ${
      c.ledger_key === "event_id"
        ? "Idempotency is keyed on the logical event, so a replay under a new delivery id is recognised."
        : "Idempotency is keyed on the delivery attempt, so a replay under a new delivery id looks new and a retry of the same delivery is discarded."
    }`,
    "",
    `enforce_order    = ${c.enforce_order}`,
    `  ${
      c.enforce_order
        ? "A delivery older than the applied provider sequence is refused."
        : "No ordering guard: a superseded event overwrites newer state."
    }`,
    "",
    `atomic_commit    = ${c.atomic_commit}`,
    `  ${
      c.atomic_commit
        ? "The ledger claim and the work are one transaction, so a failure rolls back both and the event stays retryable."
        : "The event is marked processed before the work, and the work is best effort, so a failure loses it permanently."
    }`,
    "",
    `-- Ledger constraint: ${handler.ledger_constraint}`,
    `-- Signature scheme: ${handler.signature_algorithm}`,
  ];
}

export function buildSequenceExcerptTabs(
  recorded: RecordedSequence,
  handler: HandlerSnapshot,
): ExcerptTab[] {
  const log = [
    `-- ${recorded.title}`,
    `-- Documented sequence ${recorded.sequence_id}, ${recorded.configuration.mode} configuration`,
    `-- Requirement: ${recorded.expectation_text}`,
    "",
    ...recorded.steps.flatMap(stepLines),
    verdictLine(recorded),
  ];

  return [
    {
      id: "log",
      label: "Delivery log",
      description: `Recorded delivery-by-delivery log of documented sequence ${recorded.sequence_id}.`,
      lines: log,
    },
    {
      id: "configuration",
      label: "Handler configuration",
      description:
        "The handler configuration this sequence ran against, read back from the database rather than written by hand.",
      lines: configurationLines(handler),
    },
    {
      id: "ledger",
      label: "Ledger and commitments",
      description:
        "The idempotency ledger and the payment commitments the sequence left behind.",
      lines: [
        "-- Idempotency ledger after the sequence",
        ...renderRows(
          recorded.ledger.map((entry) => ({
            ledger_key: entry.ledger_key,
            key_kind: entry.key_kind,
            event_id: entry.event_id,
            outcome: entry.outcome,
          })),
        ),
        "",
        "-- Payment commitments after the sequence",
        ...renderRows(
          recorded.commitments.map((entry) => ({
            id: entry.id,
            invoice: entry.invoice_number,
            event_id: entry.event_id,
            attempt: entry.attempt,
            amount_cents: entry.amount_cents,
          })),
        ),
        "",
        verdictLine(recorded),
      ],
    },
    {
      id: "response",
      label: "Response",
      description:
        "The raw recorded result for this sequence, with every value shown in full and no abbreviation.",
      lines: JSON.stringify(
        {
          sequence_id: recorded.sequence_id,
          expectation: recorded.expectation,
          expected_commitments: recorded.expected_commitments,
          expected_applied_cents: recorded.expected_applied_cents,
          observed_commitments: recorded.observed_commitments,
          observed_applied_cents: recorded.observed_applied_cents,
          checkpoints_held: recorded.checkpoints_held,
          expectation_met: recorded.expectation_met,
          configuration: recorded.configuration,
          steps: recorded.steps,
          ledger: recorded.ledger,
          commitments: recorded.commitments,
        },
        null,
        2,
      ).split("\n"),
    },
  ];
}
