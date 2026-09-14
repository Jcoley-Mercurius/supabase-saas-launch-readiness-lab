import "server-only";
import {
  isScenarioScoped,
  type MeasurementEvent,
  type MeasurementSurface,
} from "@/lib/measurement/events";
import { deploymentEnvironment } from "@/lib/deployment";
import { serverClient } from "@/lib/supabase/server-client";
import { SCENARIOS } from "@/lib/content/scenarios";

/*
 * The first-party measurement write path.
 *
 * Trace: MPS-MET-001 through MPS-MET-005; MTS-CAP-008, MTS-DEC-016
 *        (first-party only, no third-party analytics provider), MTS-OBS-050
 *        (separate schema, no shared identifier), MTS-RISK-001 residual.
 *
 * THIS MODULE CANNOT REACH AN INQUIRY, AND THAT IS ENFORCED TWICE.
 *
 * In the database, `measurement.record_event` is a SECURITY DEFINER function
 * in its own schema whose only effect is an insert into measurement.events;
 * the publishable key holds no privilege on any inquiry table. In this
 * repository, tests/unit/measurement-boundary.spec.ts fails if this module
 * ever imports from lib/inquiry/*, so the separation cannot decay into a
 * convenience import the way an untested one would.
 *
 * MEASUREMENT NEVER CHANGES WHAT A VISITOR SEES.
 *
 * Every failure here is swallowed. An unconfigured environment, an unreachable
 * database, a rejected constraint — all of them drop the event and return. A
 * missing count is a gap in a metric; a thrown error in a page render is a
 * broken lab, and no metric is worth that trade. This is also why the function
 * returns void and is never awaited for correctness by a caller.
 *
 * WHAT IS NOT SENT, AND CANNOT BE.
 *
 * There is no session id, no visitor id, no cookie, no IP address, no
 * referrer, and no free text of any kind. The arguments below are the entire
 * payload, and each is a value from a closed set that the DATABASE checks
 * (MTS-DEC-016's binding constraint). A caller that tried to smuggle an
 * address through `scenarioSlug` would be rejected by the check constraint,
 * not merely by this file's good intentions.
 */

const KNOWN_SLUGS = new Set(SCENARIOS.map((scenario) => scenario.slug));

export interface MeasurementInput {
  event: MeasurementEvent;
  surface: MeasurementSurface;
  scenarioSlug?: string;
}

export interface MeasurementStore {
  record(input: MeasurementInput): Promise<void>;
}

/**
 * Whether an event is well formed enough to send.
 *
 * Refuses locally what the database would refuse anyway. Not defence in depth
 * for its own sake: the check constraint is the authority, but a rejected
 * insert costs a round trip and writes a Postgres error into Supabase's logs
 * for what is really a caller bug.
 *
 * Exported so the rule can be asserted directly. It was previously inline, and
 * a test claiming a malformed event "is dropped, not sent" could only assert
 * the predicate it consulted rather than the drop itself — a test name
 * promising more than its body checked.
 */
export function isRecordable({
  event,
  scenarioSlug,
}: MeasurementInput): boolean {
  const scoped = isScenarioScoped(event);
  if (scoped) return Boolean(scenarioSlug && KNOWN_SLUGS.has(scenarioSlug));
  return !scenarioSlug;
}

export const supabaseMeasurementStore: MeasurementStore = {
  async record({ event, surface, scenarioSlug }) {
    if (!isRecordable({ event, surface, scenarioSlug })) return;

    const db = serverClient("measurement");
    if (!db) return;

    try {
      await db.rpc("record_event", {
        p_event_name: event,
        p_surface: surface,
        p_scenario_slug: scenarioSlug ?? null,
        p_environment: deploymentEnvironment(),
      });
    } catch {
      /*
       * Deliberately empty, and deliberately not logged. The error is not
       * inspected for the same reason the inquiry store does not inspect its
       * own: a PostgREST error can carry the failing statement. Here that
       * statement carries nothing sensitive, but a rule that holds only while
       * the payload happens to be harmless is not a rule.
       */
    }
  },
};

/**
 * Record one event, never throwing and never blocking a render.
 *
 * `store` is injectable so tests can assert what WOULD be written without a
 * database, which is how the inquiry path is tested too.
 */
export async function recordMeasurement(
  input: MeasurementInput,
  store: MeasurementStore = supabaseMeasurementStore,
): Promise<void> {
  try {
    await store.record(input);
  } catch {
    // See above: measurement never changes what a visitor sees.
  }
}
