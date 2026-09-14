"use client";

import { createContext, useContext, type ReactNode } from "react";

/*
 * Which scenario, if any, the surrounding evidence belongs to.
 *
 * Trace: MPS-MET-001 (proof comprehension); MTS-CAP-008, MTS-DEC-016.
 *
 * WHY A CONTEXT RATHER THAN A PROP.
 *
 * The code/log excerpt is four components deep in places (lab -> comparison ->
 * evidence panel -> excerpt) and is also rendered on the report, where no
 * scenario exists. Threading a measurement prop through every layer would put
 * an analytics argument into the signature of components whose job is
 * presentation, and would have to be repeated at each new call site — the kind
 * of plumbing that is quietly forgotten and produces a metric that undercounts
 * without anyone noticing.
 *
 * The default is null and that is the whole safety property: an excerpt
 * rendered outside a scenario — on the report, on the landing page — records
 * nothing at all. It cannot invent a scenario slug, and a scenario-scoped
 * event without its scenario is refused by the database anyway.
 */

const ScenarioMeasurementContext = createContext<string | null>(null);

export function ScenarioMeasurementProvider({
  scenarioSlug,
  children,
}: {
  scenarioSlug: string;
  children: ReactNode;
}) {
  return (
    <ScenarioMeasurementContext.Provider value={scenarioSlug}>
      {children}
    </ScenarioMeasurementContext.Provider>
  );
}

/** The enclosing scenario slug, or null when there is no scenario. */
export function useScenarioMeasurement(): string | null {
  return useContext(ScenarioMeasurementContext);
}
