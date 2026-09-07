/*
 * Turns a recorded case into the buyer-facing excerpt tabs.
 *
 * Trace: MPS-REQ-004 ("in buyer-readable language"), MPS-RULE-002/007;
 *        MDS COMPONENTS-PROPOSAL "Code or log excerpt"; MDS-REF-006.
 *
 * Formatting only. Every value shown is read from the recorded transcript, so
 * this module cannot state a result the database did not produce. The closing
 * "Result:" line is derived from the recorded outcome, never asserted.
 */

import type { ExcerptTab } from "@/components/evidence/code-excerpt";
import type { RecordedCase } from "@/lib/evidence/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Identifiers are abbreviated for reading width. The Response tab keeps them whole. */
function abbreviate(value: unknown): string {
  if (value === null || value === undefined) return "null";
  const text = String(value);
  return UUID.test(text) ? `${text.slice(0, 8)}…` : text;
}

/** A psql-style fixed-width table, so the excerpt reads like a real session. */
function renderRows(rows: Array<Record<string, unknown>>): string[] {
  if (rows.length === 0) return ["(0 rows)"];

  const columns = Object.keys(rows[0]);
  const cells = rows.map((row) =>
    columns.map((column) => abbreviate(row[column])),
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
export function resultLine(recorded: RecordedCase): string {
  switch (recorded.outcome) {
    case "rows_returned":
      return recorded.expectation === "deny"
        ? `Result: the query returned ${recorded.row_count} row(s) it should not have reached`
        : `Result: the expected rows were returned (${recorded.row_count})`;
    case "rows_written":
      return `Result: the write affected ${recorded.row_count} row(s) and the change persisted`;
    case "no_rows":
      return recorded.expectation === "deny"
        ? "Result: no rows were reachable and nothing was written"
        : "Result: no rows were returned, which is not the documented expectation";
    case "error":
      return "Result: the database refused the statement";
  }
}

export function buildExcerptTabs(recorded: RecordedCase): ExcerptTab[] {
  const header = [
    `-- ${recorded.title}`,
    `-- Acting as: ${recorded.actor_label} (database role: ${recorded.db_role})`,
    "",
  ];

  const output = [
    ...header,
    ...recorded.sql_text.split("\n"),
    "",
    ...(recorded.error_code
      ? [
          `ERROR:  ${recorded.error_message}`,
          ...(recorded.error_detail
            ? [`DETAIL: ${recorded.error_detail}`]
            : []),
          `SQLSTATE: ${recorded.error_code}`,
        ]
      : recorded.verify_sql
        ? [`UPDATE/INSERT/DELETE affected ${recorded.row_count} row(s)`]
        : renderRows(recorded.rows)),
    "",
    resultLine(recorded),
  ];

  const tabs: ExcerptTab[] = [
    {
      id: "output",
      label: "Test output",
      description: `Recorded output of documented test ${recorded.case_id}.`,
      lines: output,
    },
    {
      id: "sql",
      label: "SQL",
      description: `The statement executed by documented test ${recorded.case_id}, shown verbatim.`,
      lines: [
        `-- ${recorded.case_id} · executed as ${recorded.db_role}`,
        ...recorded.sql_text.split("\n"),
        ";",
      ],
    },
  ];

  if (recorded.verify_sql) {
    tabs.push({
      id: "verification",
      label: "Verification",
      description:
        "A read-back of the stored rows after the write, showing the state the database was actually left in.",
      lines: [
        "-- Read back after the write, as the fixture owner, to show what persisted.",
        ...recorded.verify_sql.split("\n"),
        ";",
        "",
        ...renderRows(recorded.verify_rows ?? []),
      ],
    });
  }

  tabs.push({
    id: "response",
    label: "Response",
    description:
      "The raw recorded response, with identifiers shown in full and no abbreviation.",
    lines: JSON.stringify(
      {
        case_id: recorded.case_id,
        outcome: recorded.outcome,
        row_count: recorded.row_count,
        rows: recorded.rows,
        verify_rows: recorded.verify_rows,
        error_code: recorded.error_code,
        error_message: recorded.error_message,
      },
      null,
      2,
    ).split("\n"),
  });

  return tabs;
}
