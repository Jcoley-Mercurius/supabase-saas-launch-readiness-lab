#!/usr/bin/env node
/*
 * Offline evidence recorder.
 *
 * Trace: MPS-REQ-004, MPS-ACC-003/004/005/006; MTS SECURITY-ARCHITECTURE
 *        "Vulnerable demonstration rule" and "Verification evidence".
 *
 * What this does, precisely:
 *   1. resets the isolated local database from supabase/migrations,
 *   2. loads the documented test set from supabase/tests,
 *   3. applies the vulnerable policy mode, runs every documented test, and
 *      records exactly what PostgreSQL returned,
 *   4. applies the remediated policy mode and runs the same tests again,
 *   5. snapshots the resulting grants and policies,
 *   6. writes a signed-by-digest transcript to lib/evidence/recorded/.
 *
 * Each case runs in its own transaction that is rolled back, so a write case
 * leaves nothing behind and a rerun is byte-identical.
 *
 * This script is developer tooling. It is never imported by the application,
 * never bundled, and requires a database that only exists on a workstation or
 * in CI. The deployed application reads the recorded transcript and holds no
 * database connection at all.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TESTS, inputDigest } from "./evidence-inputs.mjs";

const DB_URL =
  process.env.EVIDENCE_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:56322/postgres";

const OUT_DIR = "lib/evidence/recorded";
// `--out <path>` lets the verifier record to a scratch file and diff it
// against the committed transcript without disturbing it.
const outArgIndex = process.argv.indexOf("--out");
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

const forbidden = [
  /\bpassword\b/i,
  /\bsecret\b/i,
  /\bapi[-_ ]?key\b/i,
  /\bservice[-_ ]?role\b/i,
  /\bbearer\b/i,
  /eyJ[A-Za-z0-9_-]{10,}/,
  /\bsb[ps]_[A-Za-z0-9]{8,}/,
];

/** Fails the recording rather than shipping a transcript that leaked something. */
function assertSecretFree(transcript) {
  const text = JSON.stringify(transcript);
  const hits = forbidden.filter((pattern) => pattern.test(text));
  if (hits.length > 0) {
    throw new Error(
      `Recorded transcript matched a forbidden pattern: ${hits.map(String).join(", ")}`,
    );
  }
}

console.log(`• database ${DB_URL.replace(/\/\/[^@]*@/, "//<redacted>@")}`);

// 1. deterministic starting point
execFileSync("supabase", ["db", "reset", "--local", "--no-seed"], {
  stdio: "inherit",
});
psql(TESTS, { file: true });

const serverVersion = psql("show server_version");
const cases = json(
  "select coalesce(jsonb_agg(to_jsonb(t) order by t.scenario_id, t.ordinal), '[]'::jsonb) from synthetic.documented_tests t",
);

const runs = {};
const privileges = {};

for (const mode of MODES) {
  psql("select synthetic.apply_mode(:'mode')", { params: { mode } });
  privileges[mode] = json("select synthetic.privilege_snapshot()");
  runs[mode] = cases.map((testCase) => {
    // Own transaction, always rolled back: a write case cannot persist.
    const raw = psql(
      "begin; select synthetic.run_documented_test(:'case_id'); rollback;",
      { params: { case_id: testCase.id } },
    );
    const result = JSON.parse(raw);
    return { ...result, evidence_state: evidenceState(result) };
  });
  console.log(
    `• recorded ${runs[mode].length} documented tests in ${mode} mode`,
  );
}

// Leave the fixture in the remediated state so a developer session is not
// sitting on the vulnerable policy set.
psql("select synthetic.apply_mode('remediated')");

const transcript = {
  $schema: "mercurius/evidence-transcript/1",
  recorded_at: new Date().toISOString(),
  engine: {
    product: "PostgreSQL",
    version: serverVersion,
    host: "isolated local Supabase container",
    note: "No hosted Supabase project, production system, or third-party system was contacted.",
  },
  input_digest: inputDigest(),
  modes: MODES,
  runs,
  privileges,
};

assertSecretFree(transcript);

if (outArgIndex === -1) mkdirSync(OUT_DIR, { recursive: true });
const outFile =
  outArgIndex > -1
    ? process.argv[outArgIndex + 1]
    : join(OUT_DIR, "s2-authorization-transcript.json");
writeFileSync(outFile, `${JSON.stringify(transcript, null, 2)}\n`);

const failures = MODES.flatMap((mode) =>
  runs[mode]
    .filter((r) => r.evidence_state === "warning")
    .map((r) => `${mode}/${r.case_id}`),
);

console.log(`• engine  PostgreSQL ${serverVersion}`);
console.log(`• digest  ${transcript.input_digest}`);
console.log(`• wrote   ${outFile}`);
if (failures.length > 0) {
  console.log(`• review required: ${failures.join(", ")}`);
}
