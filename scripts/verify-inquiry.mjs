#!/usr/bin/env node
/*
 * Inquiry store verification.
 *
 * Trace: MPS-REQ-010/011/012/015, MPS-RULE-005/006/008, MPS-ACC-011/012/016;
 *        MTS SECURITY-ARCHITECTURE ("enforce RLS and grants for every exposed
 *        table; test allow and deny paths", "keep production inquiry data
 *        separate from synthetic fixtures and reset commands").
 *
 * Builds the inquiry schema from supabase/inquiry/migrations into its own
 * database and runs supabase/inquiry/tests/inquiry-checks.sql against it.
 * Every check raises on failure, so a broken boundary exits non-zero.
 *
 * This is developer tooling. The application never imports it, and it needs a
 * database that only exists on a workstation or in CI.
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ADMIN_URL,
  CHECKS,
  INQUIRY_DATABASE,
  INQUIRY_URL,
  MIGRATIONS_DIR,
  psql,
  refuseFixtureDatabase,
} from "./inquiry-db.mjs";

refuseFixtureDatabase(INQUIRY_URL);

const rebuild = !process.env.INQUIRY_DATABASE_URL;

if (rebuild) {
  // Only the local convenience database is ever dropped. A configured
  // INQUIRY_DATABASE_URL is treated as real inquiry data and is never reset.
  console.log(`• rebuilding the local ${INQUIRY_DATABASE} database`);
  psql(ADMIN_URL, {
    sql: `drop database if exists ${INQUIRY_DATABASE} with (force); create database ${INQUIRY_DATABASE};`,
    quiet: true,
  });
} else {
  console.log("• using the configured inquiry database as-is (no rebuild)");
}

for (const file of readdirSync(MIGRATIONS_DIR).sort()) {
  if (!file.endsWith(".sql")) continue;
  console.log(`• applying ${file}`);
  psql(INQUIRY_URL, { file: join(MIGRATIONS_DIR, file), quiet: true });
}

console.log(`• running ${CHECKS}`);
process.stdout.write(psql(INQUIRY_URL, { file: CHECKS }));
