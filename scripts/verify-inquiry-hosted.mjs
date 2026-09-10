#!/usr/bin/env node
/*
 * Hosted inquiry authorization check.
 *
 * Trace: MTS SECURITY-ARCHITECTURE ("enforce RLS and grants for every exposed
 *        table; test allow and deny paths"); MTS-OBS-044.
 *
 * Runs supabase/inquiry/tests/authorization-checks.sql against the REAL
 * Supabase project through the Management API, so the deny paths are proved
 * where they actually matter rather than only on a workstation.
 *
 * Why this exists as a second runner: a hosted Supabase project ships
 * `alter default privileges in schema public grant all on functions to anon,
 * authenticated, service_role`, and the local container does not. A grant can
 * therefore be correct locally and wrong in production. It was: revoking from
 * PUBLIC alone left the retention and manual-deletion functions callable by
 * any visitor holding the publishable key.
 *
 * It needs no database password. It uses the Supabase CLI's own access token,
 * so it only works for someone already logged in as the project owner.
 *
 * Read-only. Every assertion is a privilege lookup; nothing is written,
 * nothing is redacted, and no inquiry row is read.
 *
 * Usage:
 *   pnpm inquiries:check:hosted                  uses NEXT_PUBLIC_SUPABASE_URL
 *   pnpm inquiries:check:hosted <project-ref>
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/*
 * Both meta-command-free check files, run against the real project.
 *
 * MTS-OBS-044 is the reason this runner exists: a privilege can be correct
 * locally and wrong hosted, because a hosted Supabase project ships default
 * privileges the local container does not. Measurement was added in S6 under
 * MTS-OBS-050 and inherits that rule exactly — its deny paths prove nothing
 * about an environment they have not run in, so they run here too.
 */
const CHECKS = [
  "supabase/inquiry/tests/authorization-checks.sql",
  "supabase/inquiry/tests/measurement-checks.sql",
];

function projectRef() {
  const explicit = process.argv[2];
  if (explicit) return explicit;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const match = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!match) {
    console.error(
      "No project ref. Pass one as an argument, or set NEXT_PUBLIC_SUPABASE_URL.",
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

const ref = projectRef();
const response = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CHECKS.map((file) => readFileSync(file, "utf8")).join("\n"),
    }),
  },
);

const body = await response.json();

if (!response.ok) {
  // Every check raises on failure, so a raised exception IS the failure
  // report. Print its message and nothing else - never the request, which
  // carries the token.
  console.error(`FAIL (${ref}): ${body?.message ?? JSON.stringify(body)}`);
  process.exit(1);
}

console.log(
  `— all inquiry and measurement authorization checks passed against the hosted project ${ref}`,
);
