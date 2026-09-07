/*
 * The recorded evidence's input set, in one place.
 *
 * Trace: MTS SECURITY-ARCHITECTURE ("deterministic and resettable");
 *        MTS-OBS-005 (owner-confirmed recorded-and-disclosed posture,
 *        2026-09-06), which makes transcript freshness a release concern
 *        rather than a developer courtesy.
 *
 * Everything that can change a recorded result is hashed here: every
 * migration that builds the fixture and defines the two policy modes, and
 * the documented test set that is executed against it. The recorder stamps
 * this digest into the transcript; scripts/check-evidence-freshness.mjs
 * recomputes it from disk and refuses a transcript that no longer matches.
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
export const COMMITTED_TRANSCRIPT =
  "lib/evidence/recorded/s2-authorization-transcript.json";

/** Everything that can change a result, hashed so a stale transcript is detectable. */
export function inputDigest() {
  const hash = createHash("sha256");
  for (const name of readdirSync(MIGRATIONS).sort()) {
    hash.update(name);
    hash.update(readFileSync(join(MIGRATIONS, name)));
  }
  hash.update(readFileSync(TESTS));
  return `sha256:${hash.digest("hex")}`;
}
