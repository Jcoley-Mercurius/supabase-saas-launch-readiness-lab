"use client";

import type {
  MeasurementEvent,
  MeasurementSurface,
} from "@/lib/measurement/events";

/*
 * The browser half of the measurement boundary.
 *
 * Trace: MPS-MET-001 through MPS-MET-005; MTS-CAP-008, MTS-DEC-016.
 *
 * WHY THE BROWSER SENDS THESE AT ALL.
 *
 * Every page in this application is prerendered, so an event recorded during
 * server render would count builds rather than visits. The endpoint at
 * app/api/measurement exists for exactly that reason, and this is the only
 * thing in the application that posts to it.
 *
 * WHAT IT SENDS, AND WHAT IT CANNOT.
 *
 * The three closed-set values below and nothing else. No cookie is read or
 * written, no identifier is generated, no referrer is forwarded, no storage is
 * touched, and no page content of any kind travels with an event — so there is
 * no consent surface here, and a repeat visit is indistinguishable from a new
 * one. The database checks all three values again; this file's honesty is not
 * what enforces the taxonomy.
 *
 * FAILURE IS SILENT BY CONSTRUCTION.
 *
 * `keepalive` lets the request outlive a navigation, and a rejected promise is
 * swallowed. A visitor must never see an error, a console message, or a delay
 * because a count did not land: a missing count is a gap in a metric, and a
 * thrown error in a render is a broken lab.
 */

export interface MeasurementSignal {
  event: MeasurementEvent;
  surface: MeasurementSurface;
  scenarioSlug?: string;
}

export function sendMeasurement({
  event,
  surface,
  scenarioSlug,
}: MeasurementSignal): void {
  // Guarded so a component that emits from an event handler is safe to render
  // on the server as well; there is no window during prerender.
  if (typeof window === "undefined") return;

  void fetch("/api/measurement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, surface, scenarioSlug }),
    keepalive: true,
  }).catch(() => {
    // Deliberately empty. Measurement never changes what a visitor sees.
  });
}

/** The de-duplication key a caller uses to emit an event at most once. */
export function signalKey({
  event,
  surface,
  scenarioSlug,
}: MeasurementSignal): string {
  return `${event}:${surface}:${scenarioSlug ?? ""}`;
}
