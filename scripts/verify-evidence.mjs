#!/usr/bin/env node
/*
 * Evidence verification.
 *
 * Trace: MTS qa/MTS-QA.md ("Supabase migration and RLS allow/deny tests"),
 *        MTS SECURITY-ARCHITECTURE ("deterministic and resettable").
 *
 * Three things are checked, and each is a hard failure:
 *   1. the transcript freshness gate in scripts/check-evidence-freshness.mjs
 *      passes, so a transcript can never silently go stale against the fixture
 *      that produced it;
 *   2. the fixture safety checks in supabase/tests/safety-checks.sql pass;
 *   3. re-recording from a clean database twice reproduces the committed
 *      transcript exactly, apart from the wall-clock recording timestamp.
 *
 * This is the full gate and it needs PostgreSQL. Step 1 alone needs nothing
 * but the repository and is also wired into `pnpm check` as `evidence:check`,
 * so the staleness case is caught wherever checks run, not only where a
 * database exists.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { COMMITTED_TRANSCRIPT } from "./evidence-inputs.mjs";

const DB_URL =
  process.env.EVIDENCE_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:56322/postgres";
const COMMITTED = COMMITTED_TRANSCRIPT;

const scratch = mkdtempSync(join(tmpdir(), "evidence-verify-"));
let failed = false;

function step(name, run) {
  try {
    run();
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL  ${name}\n      ${error.message.split("\n")[0]}`);
  }
}

/** Everything except when the recording happened must be identical. */
function comparable(transcript) {
  const rest = { ...transcript };
  delete rest.recorded_at;
  return JSON.stringify(rest);
}

step("transcript freshness gate", () => {
  execFileSync("node", ["scripts/check-evidence-freshness.mjs"], {
    stdio: "pipe",
  });
});

step("fixture safety checks", () => {
  execFileSync(
    "psql",
    [
      "-v",
      "ON_ERROR_STOP=1",
      "-X",
      "-q",
      "--no-psqlrc",
      DB_URL,
      "-f",
      "supabase/tests/safety-checks.sql",
    ],
    { stdio: "pipe" },
  );
});

const committed = JSON.parse(readFileSync(COMMITTED, "utf8"));

for (const attempt of [1, 2]) {
  step(
    `deterministic rerun ${attempt} of 2 matches the committed transcript`,
    () => {
      const out = join(scratch, `run-${attempt}.json`);
      execFileSync("node", ["scripts/record-evidence.mjs", "--out", out], {
        stdio: "pipe",
      });
      const fresh = JSON.parse(readFileSync(out, "utf8"));
      if (fresh.input_digest !== committed.input_digest) {
        throw new Error(
          `input digest drifted: committed ${committed.input_digest}, rerun ${fresh.input_digest}. Re-record with pnpm evidence:record.`,
        );
      }
      if (comparable(fresh) !== comparable(committed)) {
        throw new Error(
          "rerun produced different evidence than the committed transcript",
        );
      }
    },
  );
}

rmSync(scratch, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
