import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import {
  MEASUREMENT_EVENTS,
  MEASUREMENT_SURFACES,
  SCENARIO_SCOPED_EVENTS,
  isScenarioScoped,
} from "@/lib/measurement/events";
import {
  isRecordable,
  recordMeasurement,
  type MeasurementInput,
} from "@/lib/measurement/store";
import { SCENARIOS } from "@/lib/content/scenarios";

/*
 * First-party measurement — the properties that must hold.
 *
 * Trace: MPS-MET-001 through MPS-MET-005; MTS-CAP-008, MTS-DEC-016 (the
 *        boundary strips inquiry text, secrets, credentials and raw evidence
 *        payloads, and no row identifies a person), MTS-OBS-050.
 *
 * The database is the authority on the taxonomy: its check constraints reject
 * an unknown name whatever this repository believes. These tests exist because
 * a typed mirror that has drifted from the authority is worse than no mirror —
 * it silently drops every event of the name it got wrong, and a metric that
 * reads zero looks exactly like a feature nobody used.
 */

const MIGRATION_DIR = "supabase/inquiry/migrations";

/**
 * Every measurement migration, in the order the database applies them.
 *
 * The taxonomy is a check constraint, and a constraint can be replaced by a
 * later migration — 20260909000005 drops and re-adds events_name_known to
 * admit the landing view. Reading only the first migration would therefore
 * assert against a constraint the database no longer has, which is the exact
 * drift these tests exist to catch.
 */
const MIGRATIONS = readdirSync(MIGRATION_DIR)
  .filter((name) => name.includes("measurement"))
  .sort()
  .map((name) => readFileSync(join(MIGRATION_DIR, name), "utf8"));

/** The base migration, which is where the table and its columns are defined. */
const MIGRATION = MIGRATIONS[0];

/** The names the database accepts NOW: the last declaration wins. */
function effectiveEventNames(): string[] {
  const declarations = MIGRATIONS.flatMap((sql) =>
    sql.split("events_name_known check (").slice(1),
  );
  const last = declarations[declarations.length - 1];
  expect(
    last,
    "no events_name_known constraint found in any migration",
  ).toBeTruthy();
  return [...last.split(")")[0].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

test.describe("the taxonomy matches the database", () => {
  test("every TypeScript event name exists in the effective check constraint", () => {
    const inDatabase = effectiveEventNames();
    for (const event of MEASUREMENT_EVENTS) {
      expect(
        inDatabase,
        `${event} is declared in TypeScript but not accepted by the database`,
      ).toContain(event);
    }
  });

  test("every event name the database accepts is declared in TypeScript", () => {
    // Parse the constraint rather than trusting a count: a name added to the
    // database and forgotten here can never be recorded.
    const inDatabase = effectiveEventNames();

    expect(inDatabase.length).toBeGreaterThan(0);
    for (const name of inDatabase) {
      expect(
        MEASUREMENT_EVENTS as readonly string[],
        `${name} is accepted by the database but not declared in TypeScript`,
      ).toContain(name);
    }
  });

  test("every surface and scenario slug is one the database accepts", () => {
    for (const surface of MEASUREMENT_SURFACES) {
      expect(MIGRATION).toContain(`'${surface}'`);
    }
    // The scenario catalogue is the app's, and the migration mirrors it as a
    // check constraint. If a scenario is ever added, this fails until the
    // migration is updated — which is the correct order for that change.
    for (const scenario of SCENARIOS) {
      expect(
        MIGRATION,
        `scenario ${scenario.slug} is not accepted by measurement.events`,
      ).toContain(`'${scenario.slug}'`);
    }
  });

  test("scenario scoping agrees with the database constraint", () => {
    for (const event of SCENARIO_SCOPED_EVENTS) {
      expect(isScenarioScoped(event)).toBe(true);
    }
    const scopedBlock = MIGRATION.split(
      "constraint events_scenario_scope_matches check (",
    )[1];
    for (const event of SCENARIO_SCOPED_EVENTS) {
      expect(
        scopedBlock,
        `${event} is scenario-scoped in TypeScript but not in the database`,
      ).toContain(`'${event}'`);
    }
  });
});

test.describe("the boundary carries nothing sensitive", () => {
  test("the payload has no field that could hold free text or an identifier", () => {
    // The type is the contract. If a field is ever added, this fails and the
    // addition has to be argued for rather than merged quietly.
    const allowed = ["event", "surface", "scenarioSlug"];
    const sample: MeasurementInput = {
      event: "report_viewed",
      surface: "report",
    };
    void sample;

    const source = readFileSync("lib/measurement/store.ts", "utf8");
    const block = source
      .split("export interface MeasurementInput {")[1]
      .split("}")[0];
    const fields = [...block.matchAll(/^\s*(\w+)\??:/gm)].map((m) => m[1]);
    expect(fields.sort()).toEqual([...allowed].sort());
  });

  test("no credential, session, cookie, or address is read anywhere in measurement", () => {
    for (const file of [
      "lib/measurement/store.ts",
      "lib/measurement/events.ts",
      "lib/measurement/client.ts",
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY/);
      expect(source).not.toMatch(/\bcookies?\s*\(/i);
      expect(source).not.toMatch(
        /x-forwarded-for|remoteAddress|\bip\b\s*[:=]/i,
      );
    }
  });
});

test.describe("measurement never changes what a visitor sees", () => {
  test("a store that throws does not propagate", async () => {
    await expect(
      recordMeasurement(
        { event: "report_viewed", surface: "report" },
        {
          record: async () => {
            throw new Error("database unreachable");
          },
        },
      ),
    ).resolves.toBeUndefined();
  });

  test("a malformed event is refused before it can reach the database", () => {
    // The real guard, asserted directly rather than through a stub that does
    // not consult it.
    expect(
      isRecordable({ event: "scenario_completed", surface: "scenario" }),
      "a scenario-scoped event with no scenario",
    ).toBe(false);
    expect(
      isRecordable({
        event: "scenario_completed",
        surface: "scenario",
        scenarioSlug: "not-a-real-scenario",
      }),
      "a scenario outside the approved catalogue",
    ).toBe(false);
    expect(
      isRecordable({
        event: "report_viewed",
        surface: "report",
        scenarioSlug: SCENARIOS[0].slug,
      }),
      "a non-scenario event carrying a scenario",
    ).toBe(false);
    expect(
      isRecordable({
        event: "scenario_completed",
        surface: "scenario",
        scenarioSlug: SCENARIOS[0].slug,
      }),
      "a well-formed scenario event",
    ).toBe(true);
    expect(
      isRecordable({ event: "report_viewed", surface: "report" }),
      "a well-formed non-scenario event",
    ).toBe(true);
  });

  test("a well-formed event reaches the store intact", async () => {
    const sent: MeasurementInput[] = [];
    await recordMeasurement(
      {
        event: "scenario_completed",
        surface: "scenario",
        scenarioSlug: SCENARIOS[0].slug,
      },
      {
        record: async (input) => {
          sent.push(input);
        },
      },
    );
    expect(sent).toHaveLength(1);
    expect(sent[0].scenarioSlug).toBe(SCENARIOS[0].slug);
  });
});

/*
 * A declared event with no emitter is the failure mode this suite previously
 * could not see.
 *
 * Twelve names were declared, the database accepted all twelve, the typed
 * mirror matched — and nine of them were never sent by anything, so MPS-MET-002
 * and MPS-MET-005 had no data at all while every taxonomy test passed. A metric
 * that reads zero looks exactly like a feature nobody used, which is the most
 * expensive kind of wrong number to publish.
 *
 * This walks the application source and requires each name to appear at a call
 * site outside lib/measurement. It cannot prove the emitter fires at the right
 * moment — that is what the browser suite is for — but it does prove that
 * adding a name to the taxonomy without wiring it up fails here.
 */
test.describe("every declared event has an emitter", () => {
  function sourcesUnder(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourcesUnder(path);
      return /\.tsx?$/.test(entry.name) ? [path] : [];
    });
  }

  // lib/measurement is excluded deliberately: it DECLARES the names, so
  // including it would let every event satisfy this test by existing.
  const CALL_SITES = [...sourcesUnder("app"), ...sourcesUnder("components")]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");

  for (const event of MEASUREMENT_EVENTS) {
    test(`${event} is emitted by at least one surface`, () => {
      expect(
        CALL_SITES.includes(`"${event}"`),
        `${event} is declared in the taxonomy but nothing in app/ or components/ ever sends it, so its metric will read zero forever`,
      ).toBe(true);
    });
  }
});
