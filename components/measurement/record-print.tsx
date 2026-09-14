"use client";

import { useEffect } from "react";
import { sendMeasurement } from "@/lib/measurement/client";
import type { MeasurementSurface } from "@/lib/measurement/events";

/*
 * Records a print of the surface it is mounted on.
 *
 * Trace: MPS-MET-004 (proposal proof reuse — "relevant proposals using the lab
 *        as evidence"); MTS-CAP-008, MTS-DEC-016.
 *
 * The report is designed to be printed (MDS-GAP-S4-001, owner-confirmed: the
 * print medium redefines the approved tokens), and a printed or saved-to-PDF
 * report is the clearest first-party signal of reuse this product can observe
 * without tracking anybody. `beforeprint` fires for both printing and
 * save-as-PDF, in every browser this project verifies against.
 *
 * Every print counts, deliberately: unlike the in-view events, a second print
 * is a second act of reuse rather than a repeat of the same one.
 *
 * What it still cannot see, stated plainly: a report saved by other means, or
 * one printed by someone the first reader forwarded it to. MPS-MET-004 stays a
 * DIRECTIONAL metric for that reason, and a count from here is a floor, never
 * a total.
 */

export function RecordPrint({ surface }: { surface: MeasurementSurface }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforePrint = () =>
      sendMeasurement({ event: "report_printed", surface });

    window.addEventListener("beforeprint", onBeforePrint);
    return () => window.removeEventListener("beforeprint", onBeforePrint);
  }, [surface]);

  return null;
}
