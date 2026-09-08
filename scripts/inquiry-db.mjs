/*
 * Shared connection handling for the two inquiry operator scripts.
 *
 * Trace: MTS SECURITY-ARCHITECTURE ("keep production inquiry data separate
 *        from synthetic fixtures and reset commands").
 *
 * The inquiry store is a SEPARATE database from the synthetic fixture. On a
 * workstation both happen to live in the same local container, so the default
 * below points at a differently-named database inside it — never at the
 * fixture database the evidence recorder resets. Against a hosted project,
 * INQUIRY_DATABASE_URL points at the isolated inquiry project instead.
 *
 * Neither script is imported by the application, and neither is bundled.
 */

import { execFileSync } from "node:child_process";

export const FIXTURE_DATABASE = "postgres";
export const INQUIRY_DATABASE = "inquiry_local";

const LOCAL_CONTAINER = "postgresql://postgres:postgres@127.0.0.1:56322";

export const ADMIN_URL = `${LOCAL_CONTAINER}/${FIXTURE_DATABASE}`;
/*
 * Trimmed on purpose. This value is normally pasted into a GitHub secret box
 * or a shell, and a trailing newline or stray space turns a working connection
 * string into an opaque parse failure at the point where it is least
 * convenient to debug - inside a scheduled job that touches real data.
 */
export const INQUIRY_URL =
  process.env.INQUIRY_DATABASE_URL?.trim() ||
  `${LOCAL_CONTAINER}/${INQUIRY_DATABASE}`;

export const MIGRATIONS_DIR = "supabase/inquiry/migrations";
export const CHECKS = "supabase/inquiry/tests/inquiry-checks.sql";

/**
 * Guard: an operator script must never be aimed at the fixture database.
 *
 * It also fails clearly on a malformed value rather than letting psql report
 * something unhelpful, because the most likely way this variable is wrong is a
 * mis-paste, not a mis-design.
 */
export function refuseFixtureDatabase(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "INQUIRY_DATABASE_URL is not a valid connection string. Expected the form " +
        "postgresql://<user>:<password>@<host>:<port>/postgres, on one line, with any " +
        "special characters in the password percent-encoded.",
    );
  }

  /*
   * The fixture database is named `postgres` on the LOCAL container. So is the
   * database on a hosted Supabase project - which is a different database
   * entirely, reached through a pooler host rather than 127.0.0.1. Only the
   * local one is refused.
   */
  const local = ["127.0.0.1", "localhost"].includes(parsed.hostname);
  if (local && parsed.pathname === `/${FIXTURE_DATABASE}`) {
    throw new Error(
      `Refusing to run against the synthetic fixture database "${FIXTURE_DATABASE}". ` +
        `The inquiry store must be a separate database (MTS SECURITY-ARCHITECTURE).`,
    );
  }
  return url;
}

export function psql(url, { file, sql, quiet = false } = {}) {
  const args = ["-v", "ON_ERROR_STOP=1", "-X", "--no-psqlrc"];
  if (quiet) args.push("-q", "-t", "-A");
  args.push(url);
  if (file) {
    args.push("-f", file);
    return execFileSync("psql", args, { encoding: "utf8" });
  }
  args.push("-f", "-");
  return execFileSync("psql", args, { encoding: "utf8", input: sql }).trim();
}
