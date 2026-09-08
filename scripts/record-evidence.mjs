#!/usr/bin/env node
/*
 * Offline evidence recorder.
 *
 * Trace: MPS-REQ-004, MPS-ACC-003/004/005/006; MTS SECURITY-ARCHITECTURE
 *        "Vulnerable demonstration rule" and "Verification evidence".
 *
 * What this does, precisely:
 *   1. resets the isolated local database from supabase/migrations,
 *   2. loads the documented test set and the documented delivery sequences
 *      from supabase/tests,
 *   3. applies the vulnerable policy and handler configuration, runs every
 *      documented test and every documented sequence, and records exactly
 *      what PostgreSQL returned,
 *   4. applies the remediated configuration and runs both sets again,
 *   5. snapshots the resulting grants, policies, and handler configuration,
 *   6. writes two signed-by-digest transcripts to lib/evidence/recorded/:
 *      the S2 authorization transcript and the S3 replay transcript.
 *
 * Each case and each sequence runs in its own transaction that is rolled back,
 * so a write leaves nothing behind and a rerun is byte-identical.
 *
 * This script is developer tooling. It is never imported by the application,
 * never bundled, and requires a database that only exists on a workstation or
 * in CI. The deployed application reads the recorded transcript and holds no
 * database connection at all.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  RECORDED_DIR,
  SEQUENCES,
  TESTS,
  TRANSCRIPTS,
  forbiddenMatches,
  inputDigest,
} from "./evidence-inputs.mjs";

const DB_URL =
  process.env.EVIDENCE_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:56322/postgres";

// `--out-dir <path>` lets the verifier record to a scratch directory and diff
// the results against the committed transcripts without disturbing them.
const outDirArg = process.argv.indexOf("--out-dir");
const OUT_DIR = outDirArg > -1 ? process.argv[outDirArg + 1] : RECORDED_DIR;
const MODES = ["vulnerable", "remediated"];

function psql(sql, { file = false, params = {} } = {}) {
  const args = ["-v", "ON_ERROR_STOP=1", "-X", "-q", "--no-psqlrc"];
  // Values are passed as psql variables and referenced as :'name', which quotes
  // them as SQL literals. Nothing here is attacker-reachable — this script is
  // offline developer tooling — but interpolating identifiers into SQL strings
  // is a habit worth not having in a repository about SQL authorization.
  for (const [name, value] of Object.entries(params)) {
    args.push("-v", `${name}=${value}`);
  }
  args.push(DB_URL);
  if (file) {
    args.push("-f", sql);
    return execFileSync("psql", args, { encoding: "utf8" });
  }
  // Read the statement from stdin rather than -c: psql expands :'name'
  // variables in a script, but not in a -c command string.
  args.push("-t", "-A", "-f", "-");
  return execFileSync("psql", args, { encoding: "utf8", input: sql }).trim();
}

function json(sql) {
  return JSON.parse(psql(sql));
}

/*
 * A recorded result becomes exactly one canonical MDS evidence state
 * (DESIGN-SYSTEM.md section 9). There is no state that means "probably fine":
 * an allow path that got blocked is "Review required", not a pass.
 */
function evidenceState({ expectation, expectation_met }) {
  if (expectation === "deny")
    return expectation_met ? "remediated" : "vulnerable";
  return expectation_met ? "remediated" : "warning";
}

/** Fails the recording rather than shipping a transcript that leaked something. */
function assertSecretFree(name, transcript) {
  const hits = forbiddenMatches(transcript);
  if (hits.length > 0) {
    throw new Error(
      `Recorded ${name} transcript matched a forbidden pattern: ${hits.map(String).join(", ")}`,
    );
  }
}

console.log(`• database ${DB_URL.replace(/\/\/[^@]*@/, "//<redacted>@")}`);

// 1. deterministic starting point
execFileSync("supabase", ["db", "reset", "--local", "--no-seed"], {
  stdio: "inherit",
});
psql(TESTS, { file: true });
psql(SEQUENCES, { file: true });

const serverVersion = psql("show server_version");
const cases = json(
  "select coalesce(jsonb_agg(to_jsonb(t) order by t.scenario_id, t.ordinal), '[]'::jsonb) from synthetic.documented_tests t",
);

const sequences = json(
  "select coalesce(jsonb_agg(to_jsonb(s) order by s.scenario_id, s.ordinal), '[]'::jsonb) from synthetic.documented_sequences s",
);

const runs = {};
const privileges = {};
const sequenceRuns = {};
const handler = {};

for (const mode of MODES) {
  psql("select synthetic.apply_mode(:'mode')", { params: { mode } });
  // The policy modes and the handler configuration are switched together from
  // the same loop variable, so the two halves of a documented configuration
  // can never drift apart in a recording.
  psql("select synthetic.apply_replay_mode(:'mode')", { params: { mode } });

  privileges[mode] = json("select synthetic.privilege_snapshot()");
  handler[mode] = json("select synthetic.replay_configuration_snapshot()");

  runs[mode] = cases.map((testCase) => {
    // Own transaction, always rolled back: a write case cannot persist.
    const raw = psql(
      "begin; select synthetic.run_documented_test(:'case_id'); rollback;",
      { params: { case_id: testCase.id } },
    );
    const result = JSON.parse(raw);
    return { ...result, evidence_state: evidenceState(result) };
  });

  sequenceRuns[mode] = sequences.map((sequence) => {
    // Same discipline: a sequence writes to the ledger and the commitment
    // table, and the rollback is what keeps the next sequence and the next
    // rerun starting from the identical state.
    const raw = psql(
      "begin; select synthetic.run_documented_sequence(:'sequence_id'); rollback;",
      { params: { sequence_id: sequence.id } },
    );
    const result = JSON.parse(raw);
    return { ...result, evidence_state: evidenceState(result) };
  });

  console.log(
    `• recorded ${runs[mode].length} documented tests and ${sequenceRuns[mode].length} documented sequences in ${mode} mode`,
  );
}

// Leave the fixture in the remediated state so a developer session is not
// sitting on the vulnerable policy set or the vulnerable handler.
psql("select synthetic.apply_mode('remediated')");
psql("select synthetic.apply_replay_mode('remediated')");

const digest = inputDigest();
const engine = {
  product: "PostgreSQL",
  version: serverVersion,
  host: "isolated local Supabase container",
  note: "No hosted Supabase project, production system, or third-party system was contacted.",
};
const recordedAt = new Date().toISOString();

const authorization = {
  $schema: TRANSCRIPTS.authorization.schema,
  recorded_at: recordedAt,
  engine,
  input_digest: digest,
  modes: MODES,
  runs,
  privileges,
};

const replay = {
  $schema: TRANSCRIPTS.replay.schema,
  recorded_at: recordedAt,
  engine,
  input_digest: digest,
  modes: MODES,
  runs: sequenceRuns,
  handler,
};

mkdirSync(OUT_DIR, { recursive: true });

for (const [name, transcript] of [
  ["authorization", authorization],
  ["replay", replay],
]) {
  assertSecretFree(name, transcript);
  const outFile = join(OUT_DIR, TRANSCRIPTS[name].file);
  writeFileSync(outFile, `${JSON.stringify(transcript, null, 2)}\n`);
  console.log(`• wrote   ${outFile}`);
}

const failures = MODES.flatMap((mode) => [
  ...runs[mode]
    .filter((r) => r.evidence_state === "warning")
    .map((r) => `${mode}/${r.case_id}`),
  ...sequenceRuns[mode]
    .filter((r) => r.evidence_state === "warning")
    .map((r) => `${mode}/${r.sequence_id}`),
]);

console.log(`• engine  PostgreSQL ${serverVersion}`);
console.log(`• digest  ${digest}`);
if (failures.length > 0) {
  console.log(`• review required: ${failures.join(", ")}`);
}
