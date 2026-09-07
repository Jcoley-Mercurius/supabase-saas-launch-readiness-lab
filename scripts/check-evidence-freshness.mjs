#!/usr/bin/env node
/*
 * Evidence freshness gate.
 *
 * Trace: MTS-OBS-005 (owner decision, 2026-09-06: the lab presents recorded
 *        evidence, disclosed as such, and the disclosure is only honest while
 *        the transcript still corresponds to the fixture that produced it);
 *        MTS SECURITY-ARCHITECTURE "Vulnerable demonstration rule".
 *
 * The full verification in scripts/verify-evidence.mjs re-records twice from a
 * clean database and needs PostgreSQL. This check is the part that needs
 * nothing but the checked-out repository, so it can run on every ordinary
 * check run rather than only where a database exists:
 *
 *   1. the committed transcript parses and carries the expected schema;
 *   2. its input digest still matches the migrations and documented test set
 *      on disk, so an edited fixture cannot leave a stale transcript being
 *      replayed to buyers as current;
 *   3. the transcript records both documented policy modes and is non-empty;
 *   4. no forbidden credential-shaped string is present.
 *
 * A failure here means the fixture changed and the transcript was not
 * re-recorded. Fix it with `pnpm db:start && pnpm evidence:record`, not by
 * editing the transcript: a hand-edited transcript is exactly the thing the
 * recorded-evidence posture promises buyers does not happen.
 */

import { readFileSync } from "node:fs";
import {
  COMMITTED_TRANSCRIPT,
  MIGRATIONS,
  TESTS,
  inputDigest,
} from "./evidence-inputs.mjs";

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

let transcript = null;

step("committed transcript parses", () => {
  transcript = JSON.parse(readFileSync(COMMITTED_TRANSCRIPT, "utf8"));
  if (transcript.$schema !== "mercurius/evidence-transcript/1") {
    throw new Error(
      `unexpected transcript schema: ${String(transcript.$schema)}`,
    );
  }
});

step(`transcript digest matches ${MIGRATIONS} and ${TESTS}`, () => {
  if (!transcript) throw new Error("transcript did not parse");
  const onDisk = inputDigest();
  if (transcript.input_digest !== onDisk) {
    throw new Error(
      `stale transcript: recorded against ${transcript.input_digest}, fixture on disk is ${onDisk}. Re-record with pnpm evidence:record.`,
    );
  }
});

step("transcript records both documented policy modes", () => {
  if (!transcript) throw new Error("transcript did not parse");
  for (const mode of ["vulnerable", "remediated"]) {
    if (!transcript.modes?.includes(mode)) {
      throw new Error(`transcript does not declare the ${mode} mode`);
    }
    if (
      !Array.isArray(transcript.runs?.[mode]) ||
      !transcript.runs[mode].length
    ) {
      throw new Error(`transcript records no documented test in ${mode} mode`);
    }
  }
});

step("transcript is free of credential-shaped strings", () => {
  if (!transcript) throw new Error("transcript did not parse");
  const forbidden = [
    /\bpassword\b/i,
    /\bsecret\b/i,
    /\bapi[-_ ]?key\b/i,
    /\bservice[-_ ]?role\b/i,
    /\bbearer\b/i,
    /eyJ[A-Za-z0-9_-]{10,}/,
    /\bsb[ps]_[A-Za-z0-9]{8,}/,
  ];
  const text = JSON.stringify(transcript);
  const hits = forbidden.filter((pattern) => pattern.test(text));
  if (hits.length > 0) {
    throw new Error(
      `matched a forbidden pattern: ${hits.map(String).join(", ")}`,
    );
  }
});

process.exit(failed ? 1 : 0);
