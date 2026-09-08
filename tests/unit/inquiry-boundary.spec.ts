import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

/*
 * The MTS-RISK-001 residual, enforced as a test rather than as a convention.
 *
 * The recorded control for MTS-RISK-001 is that a crafted request cannot reach
 * a database through the deployed application. S2 satisfied it absolutely —
 * the application held no database client at all. S5 necessarily adds one, and
 * the risk record's residual names the condition that keeps the control valid:
 * "S5 adds a Supabase client for inquiries and must keep it on a separate path
 * from the evidence engine."
 *
 * "Separate path" is only true while nothing imports across it, and an import
 * is one autocomplete away. So these tests walk the actual static import graph
 * of both trees and fail if either reaches the other, if the evidence engine
 * acquires a database client, or if a credential name appears outside the two
 * modules approved to read one.
 */

const ROOTS = ["app", "components", "lib", "scripts"];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
    } else if (/\.(ts|tsx|mjs)$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

const ALL_FILES = ROOTS.flatMap(sourceFiles);

function importsOf(file: string): string[] {
  const source = readFileSync(file, "utf8");
  return [
    ...source.matchAll(
      /(?:from\s+|import\s*\(\s*|require\(\s*)["']([^"']+)["']/g,
    ),
  ].map((match) => match[1]);
}

const inquiryFiles = ALL_FILES.filter((file) => file.startsWith("lib/inquiry"));
const evidenceFiles = ALL_FILES.filter((file) =>
  file.startsWith("lib/evidence"),
);

test.describe("the inquiry path and the evidence engine stay separate", () => {
  test("both trees exist, so a passing result is not vacuous", () => {
    expect(inquiryFiles.length).toBeGreaterThan(3);
    expect(evidenceFiles.length).toBeGreaterThan(3);
  });

  test("the evidence engine imports nothing from the inquiry path", () => {
    for (const file of evidenceFiles) {
      for (const specifier of importsOf(file)) {
        expect(
          specifier,
          `${file} imports ${specifier}; the evidence engine must not reach the inquiry path (MTS-RISK-001 residual)`,
        ).not.toMatch(/inquiry/i);
      }
    }
  });

  test("the inquiry path imports nothing from the evidence engine", () => {
    for (const file of inquiryFiles) {
      for (const specifier of importsOf(file)) {
        expect(
          specifier,
          `${file} imports ${specifier}; the inquiry path must not reach the evidence engine (MTS-RISK-001 residual)`,
        ).not.toMatch(/evidence/i);
      }
    }
  });

  test("the evidence engine holds no database client, driver, or connection", () => {
    for (const file of evidenceFiles) {
      const specifiers = importsOf(file);
      for (const specifier of specifiers) {
        expect(
          specifier,
          `${file} imports a database client; the evidence engine replays a recorded transcript and must hold no connection`,
        ).not.toMatch(/@supabase|^pg$|postgres/i);
      }
      expect(
        readFileSync(file, "utf8"),
        `${file} contains a connection string`,
      ).not.toMatch(/postgres(ql)?:\/\//);
    }
  });

  test("only the two approved modules read a credential from the environment", () => {
    const approved = new Set(["lib/inquiry/store.ts", "lib/inquiry/notify.ts"]);
    const secretNames =
      /process\.env\.(SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)/;

    for (const file of ALL_FILES) {
      if (approved.has(file) || file.startsWith("scripts/")) continue;
      expect(
        readFileSync(file, "utf8"),
        `${file} reads a credential from the environment; only ${[...approved].join(" and ")} may`,
      ).not.toMatch(secretNames);
    }
  });

  test("no service-role key is read anywhere", () => {
    // INTEGRATION-MANIFEST admits one "only if a later approved server
    // operation requires it". None does: the approved model reaches the store
    // through SECURITY DEFINER functions with the publishable key.
    for (const file of ALL_FILES) {
      expect(
        readFileSync(file, "utf8"),
        `${file} reads SUPABASE_SERVICE_ROLE_KEY, which is not approved for use`,
      ).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    }
  });

  test("the client bundle cannot import a server-only inquiry module", () => {
    for (const file of [
      "lib/inquiry/store.ts",
      "lib/inquiry/notify.ts",
      "lib/inquiry/submit.ts",
    ]) {
      expect(
        readFileSync(file, "utf8"),
        `${file} is missing the server-only guard`,
      ).toContain('import "server-only"');
    }
  });

  test("the inquiry store is reached from exactly one module", () => {
    const constructors = ALL_FILES.filter((file) =>
      /createClient\s*\(/.test(readFileSync(file, "utf8")),
    );
    expect(constructors).toEqual(["lib/inquiry/store.ts"]);
  });
});
