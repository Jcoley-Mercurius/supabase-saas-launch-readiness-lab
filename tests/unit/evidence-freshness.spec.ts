import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

/*
 * Trace: MTS-OBS-005 (owner decision, 2026-09-06 — recorded-and-disclosed);
 *        MTS SECURITY-ARCHITECTURE "Vulnerable demonstration rule".
 *
 * The freshness gate is the thing that keeps the disclosure honest: the lab
 * tells a buyer it is replaying a transcript recorded from a named fixture,
 * and that is only true while the transcript still corresponds to that
 * fixture. Running it here means an edited migration or documented test fails
 * the ordinary test run, not just the database-backed verification that needs
 * PostgreSQL to be up.
 */
test("the committed transcript is fresh against the fixture on disk", () => {
  const output = execFileSync(
    "node",
    ["scripts/check-evidence-freshness.mjs"],
    {
      encoding: "utf8",
    },
  );

  expect(output).toContain("PASS  committed transcript parses");
  expect(output).toContain("PASS  transcript digest matches");
  expect(output).toContain(
    "PASS  transcript records both documented policy modes",
  );
  expect(output).toContain(
    "PASS  transcript is free of credential-shaped strings",
  );
  expect(output).not.toContain("FAIL");
});
