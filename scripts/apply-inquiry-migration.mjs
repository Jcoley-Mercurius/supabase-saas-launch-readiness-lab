#!/usr/bin/env node
/*
 * Apply one inquiry-project migration to the hosted Supabase project.
 *
 * Trace: MTS-CHG-014 and MTS-CHG-020 applied the earlier migrations this way
 *        by hand; MTS-OBS-052 is what a hand-applied step costs when it is
 *        missed. MTS SECURITY-ARCHITECTURE (secrets stay out of source, logs,
 *        and evidence).
 *
 * WHY THIS EXISTS AS A COMMITTED SCRIPT.
 *
 * The migrations under supabase/inquiry/ are not applied by the Supabase CLI.
 * `supabase db push` reads supabase/migrations, which is the SYNTHETIC FIXTURE
 * set — pushing that to the hosted inquiry project would install the
 * deliberately vulnerable policy sets next to real buyer contact data. So the
 * inquiry set has always been applied through the Management API instead, and
 * doing that from an ad-hoc command means the step is invisible, unreviewable,
 * and easy to forget. Here it is a reviewed file with the guards written down.
 *
 * It needs no database password. It uses the Supabase CLI's own access token,
 * so it works only for someone already logged in as the project owner, exactly
 * as scripts/verify-inquiry-hosted.mjs does.
 *
 * GUARDS.
 *
 *  - only files under supabase/inquiry/migrations are accepted, so the fixture
 *    set cannot be sent to the inquiry project by a typo;
 *  - the target ref is stated explicitly or read from the configured URL;
 *  - the statement text is printed before it runs, so what was applied is in
 *    the operator's own scrollback;
 *  - nothing about the request, including the token, is ever printed.
 *
 * Migrations in this project are additive by policy, so re-running one is
 * expected to be safe; that is a property of how they are written, not
 * something this script enforces.
 *
 * Usage:
 *   node scripts/apply-inquiry-migration.mjs <file> [project-ref]
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const ALLOWED_DIR = resolve("supabase/inquiry/migrations");

function migrationFile() {
  const given = process.argv[2];
  if (!given) {
    console.error(
      "Usage: node scripts/apply-inquiry-migration.mjs <file> [project-ref]",
    );
    process.exit(2);
  }
  const path = resolve(given);
  if (!path.startsWith(ALLOWED_DIR + "/")) {
    console.error(
      `Refused: ${given} is not under supabase/inquiry/migrations.\n` +
        "The fixture migrations must never be applied to the inquiry project.",
    );
    process.exit(2);
  }
  return path;
}

function projectRef() {
  const explicit = process.argv[3];
  if (explicit) return explicit;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const match = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!match) {
    console.error(
      "No project ref. Pass one as the second argument, or set NEXT_PUBLIC_SUPABASE_URL.",
    );
    process.exit(2);
  }
  return match[1];
}

function accessToken() {
  const fromEnv = process.env.SUPABASE_ACCESS_TOKEN;
  if (fromEnv) return fromEnv.trim();
  try {
    return readFileSync(
      join(homedir(), ".supabase", "access-token"),
      "utf8",
    ).trim();
  } catch {
    console.error(
      "Not logged in. Run `supabase login`, or set SUPABASE_ACCESS_TOKEN.",
    );
    process.exit(2);
  }
}

const file = migrationFile();
const ref = projectRef();
const query = readFileSync(file, "utf8");

console.log(`Applying ${file}`);
console.log(`         to hosted project ${ref}\n`);
console.log(query);

const response = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

const body = await response.json().catch(() => null);

if (!response.ok) {
  // Print the message only. The request carries the token and the response can
  // echo the failing statement; neither belongs in a log.
  console.error(`\nFAIL (${ref}): ${body?.message ?? response.status}`);
  process.exit(1);
}

console.log(
  `\n— applied to ${ref}. Re-run \`pnpm inquiries:check:hosted\` to re-prove the deny paths.`,
);
