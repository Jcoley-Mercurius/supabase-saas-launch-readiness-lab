"use client";

import { useEffect, useRef } from "react";
import { sendMeasurement, signalKey } from "@/lib/measurement/client";
import type {
  MeasurementEvent,
  MeasurementSurface,
} from "@/lib/measurement/events";

/*
 * Records one event when a surface is viewed.
 *
 * Trace: MPS-MET-001 through MPS-MET-005; MTS-CAP-008, MTS-DEC-016.
 *
 * WHY A CLIENT COMPONENT.
 *
 * The pages this sits on are prerendered at build time, so anything recorded
 * during server render would count builds rather than visits. This runs in the
 * browser, once per mount, which is the only place a per-visit count exists.
 *
 * It renders nothing. It has no visual output, no layout effect, and no
 * accessible presence — it must never affect what the approved MDS composition
 * puts on the page, and a measurement component that rendered anything would
 * be a design change nobody approved.
 *
 * WHAT IT SENDS, AND WHAT IT CANNOT.
 *
 * The three values below and nothing else. No cookie is read or written, no
 * identifier is generated, no referrer is forwarded, and no storage is
 * touched — so there is no consent surface here, and repeat visits are
 * indistinguishable from new ones. That is the accepted cost recorded in
 * MTS-CHG-019: these are event counts, not unique visitors.
 *
 * Failure is silent by construction, and the request itself is built in
 * lib/measurement/client — every emitter in the application shares that one
 * path, so what an event may carry is decided in a single place rather than at
 * each call site.
 */

export function RecordView({
  event,
  surface,
  scenarioSlug,
}: {
  event: MeasurementEvent;
  surface: MeasurementSurface;
  scenarioSlug?: string;
}) {
  /*
   * React runs effects twice in development Strict Mode, and a remount would
   * otherwise double every count. The guard keys on the event so a client-side
   * navigation to a different scenario still records, while a re-render of the
   * same one does not.
   */
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    const key = signalKey({ event, surface, scenarioSlug });
    if (recorded.current === key) return;
    recorded.current = key;

    sendMeasurement({ event, surface, scenarioSlug });
  }, [event, surface, scenarioSlug]);

  return null;
}
