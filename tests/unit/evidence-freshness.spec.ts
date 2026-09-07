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
test("both committed transcripts are fresh against the fixture on disk", () => {
  const output = execFileSync(
    "node",
    ["scripts/check-evidence-freshness.mjs"],
    {
      encoding: "utf8",
    },
  );

  for (const name of ["authorization", "replay"]) {
    expect(output).toContain(`PASS  committed ${name} transcript parses`);
    expect(output).toContain(`PASS  ${name} transcript digest matches`);
    expect(output).toContain(
      `PASS  ${name} transcript records both documented modes`,
    );
    expect(output).toContain(
      `PASS  ${name} transcript is free of credential-shaped strings`,
    );
  }
  expect(output).toContain(
    "PASS  both transcripts were recorded from the same fixture",
  );
  expect(output).not.toContain("FAIL");
});
