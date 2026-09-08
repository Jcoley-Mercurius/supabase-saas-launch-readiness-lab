/*
 * The recorded evidence's input set, in one place.
 *
 * Trace: MTS SECURITY-ARCHITECTURE ("deterministic and resettable");
 *        MTS-OBS-005 (owner-confirmed recorded-and-disclosed posture,
 *        2026-09-06), which makes transcript freshness a release concern
 *        rather than a developer courtesy.
 *
 * Everything that can change a recorded result is hashed here: every
 * migration that builds the fixture, defines the two policy modes, and
 * defines the webhook handler, plus both documented sets that are executed
 * against it. The recorder stamps this digest into every transcript;
 * scripts/check-evidence-freshness.mjs recomputes it from disk and refuses a
 * transcript that no longer matches.
 *
 * One digest covers both transcripts on purpose. The S2 and S3 evidence come
 * out of the same fixture in the same recorder run, so a change to any part of
 * it invalidates both recordings and both must be re-recorded together. A
 * per-transcript digest would let one of them quietly survive a fixture change
 * that could have altered it.
 *
 * This module touches no database, so the freshness check can run anywhere
 * the repository is checked out - including a CI job with no PostgreSQL
 * service and no Supabase CLI.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const MIGRATIONS = "supabase/migrations";
export const TESTS = "supabase/tests/documented-tests.sql";
export const SEQUENCES = "supabase/tests/documented-sequences.sql";

export const RECORDED_DIR = "lib/evidence/recorded";

/** Every transcript the application replays, keyed by its file name. */
export const TRANSCRIPTS = {
  authorization: {
    file: "s2-authorization-transcript.json",
    schema: "mercurius/evidence-transcript/1",
  },
  replay: {
    file: "s3-replay-transcript.json",
    schema: "mercurius/replay-transcript/1",
  },
};

export const COMMITTED_TRANSCRIPT = join(
  RECORDED_DIR,
  TRANSCRIPTS.authorization.file,
);
export const COMMITTED_REPLAY_TRANSCRIPT = join(
  RECORDED_DIR,
  TRANSCRIPTS.replay.file,
);

/*
 * The invented signing string the webhook fixture uses. It is not a
 * credential, but it must never reach a recorded transcript: the moment a
 * signing value appears in published evidence, the habit that keeps a real one
 * out of published evidence has already been broken. Both the recorder and the
 * freshness gate fail on it.
 */
export const SIGNING_MATERIAL =
  "synthetic-signing-material-not-a-real-credential";

/** Credential shapes that must never appear in a transcript. */
export const FORBIDDEN_PATTERNS = [
  /\bpassword\b/i,
  /\bsecret\b/i,
  /\bapi[-_ ]?key\b/i,
  /\bservice[-_ ]?role\b/i,
  /\bbearer\b/i,
  /eyJ[A-Za-z0-9_-]{10,}/,
  /\bsb[ps]_[A-Za-z0-9]{8,}/,
  new RegExp(SIGNING_MATERIAL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
];

/** Returns the patterns a payload matched, so a caller can fail loudly. */
export function forbiddenMatches(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(text));
}

/** Everything that can change a result, hashed so a stale transcript is detectable. */
export function inputDigest() {
  const hash = createHash("sha256");
  for (const name of readdirSync(MIGRATIONS).sort()) {
    hash.update(name);
    hash.update(readFileSync(join(MIGRATIONS, name)));
  }
  for (const file of [TESTS, SEQUENCES]) {
    hash.update(file);
    hash.update(readFileSync(file));
  }
  return `sha256:${hash.digest("hex")}`;
}
