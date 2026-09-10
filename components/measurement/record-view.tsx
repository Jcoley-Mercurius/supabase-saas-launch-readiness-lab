"use client";

import { useEffect, useRef } from "react";
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
 * Failure is silent by construction. `keepalive` lets the request outlive a
 * navigation, and a rejected promise is swallowed: a visitor must never see an
 * error, a console message, or a delay because a count did not land.
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
    const key = `${event}:${surface}:${scenarioSlug ?? ""}`;
    if (recorded.current === key) return;
    recorded.current = key;

    void fetch("/api/measurement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, surface, scenarioSlug }),
      keepalive: true,
    }).catch(() => {
      // Deliberately empty. Measurement never changes what a visitor sees.
    });
  }, [event, surface, scenarioSlug]);

  return null;
}
