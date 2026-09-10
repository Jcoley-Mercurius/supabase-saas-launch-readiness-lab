import { NextResponse } from "next/server";
import {
  MEASUREMENT_EVENTS,
  MEASUREMENT_SURFACES,
  type MeasurementEvent,
  type MeasurementSurface,
} from "@/lib/measurement/events";
import { isRecordable, recordMeasurement } from "@/lib/measurement/store";

/*
 * The measurement route handler.
 *
 * Trace: MPS-MET-001 through MPS-MET-005; MTS-CAP-008, MTS-DEC-016
 *        (first-party only), MTS-OBS-050 (separation), MTS-OBS-037 (bounded
 *        abuse control, never address-based).
 *
 * WHY A ROUTE AT ALL.
 *
 * Every page in this application is static or SSG — the build output prerenders
 * /, /scenarios, /report, /inquiry, /method and /about, and generates the
 * scenario pages from generateStaticParams. Recording an event during server
 * render would therefore fire ONCE AT BUILD TIME rather than per visit, and
 * every metric would read near-zero forever while looking exactly like a
 * product nobody used. A dynamic endpoint the client posts to is what makes a
 * per-visit count possible at all.
 *
 * POST only, for the same reason the inquiry route is POST only: a GET would
 * be a read path into a table whose entire design is that it has none.
 *
 * THE RESPONSE IS ALWAYS THE SAME.
 *
 * 204, whatever happened. Accepted, malformed, rate-limited, dropped because
 * the database was unreachable — the caller cannot tell, and that is
 * deliberate. A measurement endpoint that reported its own state would let a
 * visitor infer whether the store is up, how full the rate window is, or which
 * event names exist. None of that is a visitor's business, and none of it is
 * worth a single byte of information leak on a site about launch readiness.
 *
 * It also means measurement can never surface an error to a person. A failed
 * count is a gap in a metric; a visible error is a broken lab.
 */

export const dynamic = "force-dynamic";

/** 204 regardless of outcome. See above — this is the only response. */
const NO_CONTENT = new NextResponse(null, { status: 204 });

function accepted(value: unknown): {
  event: MeasurementEvent;
  surface: MeasurementSurface;
  scenarioSlug?: string;
} | null {
  if (typeof value !== "object" || value === null) return null;
  const { event, surface, scenarioSlug } = value as Record<string, unknown>;

  // Membership of the closed taxonomy, checked before anything reaches the
  // database. The database checks it again — that is the authority — but a
  // rejected insert costs a round trip and writes a Postgres error into the
  // logs for what is really a malformed request.
  if (!MEASUREMENT_EVENTS.includes(event as MeasurementEvent)) return null;
  if (!MEASUREMENT_SURFACES.includes(surface as MeasurementSurface))
    return null;

  // Anything other than a string is refused rather than coerced: coercion is
  // how an object or an array becomes a value nobody intended to store.
  if (scenarioSlug !== undefined && typeof scenarioSlug !== "string") {
    return null;
  }

  return {
    event: event as MeasurementEvent,
    surface: surface as MeasurementSurface,
    scenarioSlug: scenarioSlug as string | undefined,
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NO_CONTENT;
  }

  const input = accepted(payload);
  if (!input || !isRecordable(input)) return NO_CONTENT;

  // Never awaited for correctness by the caller, and never allowed to throw.
  await recordMeasurement(input);
  return NO_CONTENT;
}
