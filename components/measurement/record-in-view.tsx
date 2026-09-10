"use client";

import { useEffect, useRef } from "react";
import { sendMeasurement } from "@/lib/measurement/client";
import type {
  MeasurementEvent,
  MeasurementSurface,
} from "@/lib/measurement/events";

/*
 * Records one event the first time a region is actually on screen.
 *
 * Trace: MPS-MET-001 (proof comprehension — "do not infer understanding from
 *        page views alone"); MTS-CAP-008, MTS-DEC-016.
 *
 * WHY IN-VIEW RATHER THAN ON MOUNT.
 *
 * The comparison and the limitation are on the scenario page from the moment
 * it renders. Counting them on mount would produce a number identical to
 * scenario_viewed — three metrics measuring one thing, and MPS-MET-001
 * explicitly warns against reading comprehension from page views. Reaching the
 * region is the weakest claim that is still true: the evidence was on screen.
 * It is not a claim that anybody read it, and no figure derived from it may
 * say so.
 *
 * WHY IT OBSERVES BY ID AND RENDERS NOTHING.
 *
 * A wrapper element would be the obvious implementation and is the wrong one:
 * these regions sit in flex columns with approved gap spacing, so any extra
 * child — even a zero-height one — changes the spacing the MDS specifies.
 * Measurement must never move a pixel of an approved composition. Observing an
 * existing element by id adds no node at all; the only change at the target is
 * an `id` attribute, which has no visual effect.
 *
 * Failure is silent in every direction. No IntersectionObserver, no element
 * with that id, a disconnected observer — the event is dropped and nothing
 * else happens.
 */

export function RecordInView({
  event,
  surface,
  scenarioSlug,
  targetId,
}: {
  event: MeasurementEvent;
  surface: MeasurementSurface;
  scenarioSlug?: string;
  /** The id of an element already in the approved composition. */
  targetId: string;
}) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (recorded.current) return;
        recorded.current = true;
        observer.disconnect();
        sendMeasurement({ event, surface, scenarioSlug });
      },
      // A sliver is enough. Requiring a fraction of a tall evidence region
      // would silently exclude anyone on a small viewport, which would bias
      // the metric towards desktop.
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [event, surface, scenarioSlug, targetId]);

  return null;
}
