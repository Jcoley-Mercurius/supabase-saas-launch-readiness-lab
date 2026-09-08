#!/usr/bin/env node
/*
 * Inquiry retention — the operator half of MPS-REQ-015.
 *
 * Trace: MPS-REQ-015, MPS-RULE-008, MPS-ACC-016 ("Given an inquiry record
 *        reaches 12 months after its latest activity or is manually deleted
 *        earlier, when retention processing completes, then the inquiry
 *        content is removed and only minimal operational deduplication
 *        metadata remains when necessary.").
 *
 * Owner decision 2026-09-08: retention runs as a SQL function invoked by this
 * command, not as a database-scheduled job. Scheduling this command is an
 * owner operations action and is recorded as an open item, not assumed here.
 *
 * Usage:
 *   pnpm inquiries:retain              redact everything past 12 months
 *   pnpm inquiries:retain --dry-run    report what is due, change nothing
 *   pnpm inquiries:retain --delete <uuid>   earlier manual deletion of one record
 *
 * It prints counts and identifiers only. It never prints inquiry content.
 */

import { INQUIRY_URL, psql, refuseFixtureDatabase } from "./inquiry-db.mjs";

refuseFixtureDatabase(INQUIRY_URL);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const deleteIndex = args.indexOf("--delete");

if (deleteIndex > -1) {
  const reference = args[deleteIndex + 1];
  if (!/^[0-9a-f-]{36}$/i.test(reference ?? "")) {
    console.error("Usage: pnpm inquiries:retain --delete <inquiry-uuid>");
    process.exit(2);
  }
  const applied = psql(INQUIRY_URL, {
    sql: `select public.redact_inquiry('${reference}');`,
    quiet: true,
  });
  console.log(
    applied === "t"
      ? `Redacted ${reference}: all inquiry content removed, bounded deduplication metadata retained.`
      : `No change: ${reference} does not exist or was already redacted.`,
  );
  process.exit(0);
}

const due = psql(INQUIRY_URL, {
  sql: `select count(*) from public.inquiries
         where redacted_at is null
           and last_activity_at <= now() - interval '12 months';`,
  quiet: true,
});

if (dryRun) {
  console.log(`${due} inquiry record(s) are past 12 months of inactivity.`);
  process.exit(0);
}

const redacted = psql(INQUIRY_URL, {
  sql: "select public.redact_expired_inquiries();",
  quiet: true,
});
console.log(
  `${redacted} inquiry record(s) redacted (was ${due} due). Content removed; bounded deduplication metadata retained.`,
);
