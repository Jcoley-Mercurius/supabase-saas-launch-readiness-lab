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
 *   1. both committed transcripts parse and carry their expected schema;
 *   2. their input digests still match the migrations and both documented sets
 *      on disk, so an edited fixture cannot leave a stale transcript being
 *      replayed to buyers as current;
 *   3. each transcript records both documented modes and is non-empty;
 *   4. no forbidden credential-shaped string is present, including the
 *      fixture's own invented webhook signing string.
 *
 * A failure here means the fixture changed and the transcripts were not
 * re-recorded. Fix it with `pnpm db:start && pnpm evidence:record`, not by
 * editing a transcript: a hand-edited transcript is exactly the thing the
 * recorded-evidence posture promises buyers does not happen.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MIGRATIONS,
  RECORDED_DIR,
  SEQUENCES,
  TESTS,
  TRANSCRIPTS,
  forbiddenMatches,
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

const onDisk = inputDigest();

for (const [name, spec] of Object.entries(TRANSCRIPTS)) {
  let transcript = null;

  step(`committed ${name} transcript parses`, () => {
    transcript = JSON.parse(
      readFileSync(join(RECORDED_DIR, spec.file), "utf8"),
    );
    if (transcript.$schema !== spec.schema) {
      throw new Error(
        `unexpected transcript schema: ${String(transcript.$schema)}`,
      );
    }
  });

  step(
    `${name} transcript digest matches ${MIGRATIONS}, ${TESTS} and ${SEQUENCES}`,
    () => {
      if (!transcript) throw new Error("transcript did not parse");
      if (transcript.input_digest !== onDisk) {
        throw new Error(
          `stale transcript: recorded against ${transcript.input_digest}, fixture on disk is ${onDisk}. Re-record with pnpm evidence:record.`,
        );
      }
    },
  );

  step(`${name} transcript records both documented modes`, () => {
    if (!transcript) throw new Error("transcript did not parse");
    for (const mode of ["vulnerable", "remediated"]) {
      if (!transcript.modes?.includes(mode)) {
        throw new Error(`transcript does not declare the ${mode} mode`);
      }
      if (
        !Array.isArray(transcript.runs?.[mode]) ||
        !transcript.runs[mode].length
      ) {
        throw new Error(`transcript records no documented run in ${mode} mode`);
      }
    }
  });

  step(`${name} transcript is free of credential-shaped strings`, () => {
    if (!transcript) throw new Error("transcript did not parse");
    const hits = forbiddenMatches(transcript);
    if (hits.length > 0) {
      throw new Error(
        `matched a forbidden pattern: ${hits.map(String).join(", ")}`,
      );
    }
  });
}

/*
 * Both transcripts come out of one recorder run against one fixture, so a
 * digest that matches the disk but not its sibling would mean the two halves
 * of the evidence were recorded against different fixtures.
 */
step("both transcripts were recorded from the same fixture", () => {
  const digests = Object.values(TRANSCRIPTS).map(
    (spec) =>
      JSON.parse(readFileSync(join(RECORDED_DIR, spec.file), "utf8"))
        .input_digest,
  );
  if (new Set(digests).size !== 1) {
    throw new Error(
      `transcripts carry different digests: ${digests.join(", ")}`,
    );
  }
});

process.exit(failed ? 1 : 0);
