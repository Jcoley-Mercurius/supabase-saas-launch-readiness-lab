/*
 * The first-party measurement taxonomy.
 *
 * Trace: MPS-MET-001 (proof comprehension), MPS-MET-002 (scenario
 *        completion), MPS-MET-003 (qualified inquiry conversion),
 *        MPS-MET-004 (proposal proof reuse), MPS-MET-005 (buyer signal
 *        capture); MTS-CAP-008, MTS-DEC-016.
 *
 * This file holds no credential and reaches no database, so it is safe on
 * either side of the server boundary. The write path is lib/measurement/store.
 *
 * The names here MUST match the check constraint in
 * supabase/inquiry/migrations/20260909000003_measurement_store.sql. The
 * database is the definition; this is the typed mirror of it, and
 * tests/unit/measurement-boundary.spec.ts fails if the two drift apart. That
 * direction is deliberate: a taxonomy enforced only in TypeScript would be a
 * convention, and a caller reaching the function directly could write anything.
 */

export const MEASUREMENT_EVENTS = [
  // MPS-MET-001 — did the proof land?
  "scenario_viewed",
  "evidence_excerpt_opened",
  "comparison_viewed",
  "limitation_viewed",
  // MPS-MET-002 — did the scenario get finished?
  "scenario_step_advanced",
  "scenario_completed",
  // MPS-MET-004 — is the published proof being reused?
  "report_viewed",
  "report_section_opened",
  "report_printed",
  // MPS-MET-003 and MPS-MET-005 — did it convert, and what signal came with it?
  "inquiry_started",
  "inquiry_submitted",
  "inquiry_acknowledged",
] as const;

export type MeasurementEvent = (typeof MEASUREMENT_EVENTS)[number];

/**
 * Route CLASS, never a URL. A scenario path names the vulnerability class
 * being demonstrated, and a full path is the kind of value that quietly
 * becomes an identifier.
 */
export const MEASUREMENT_SURFACES = [
  "landing",
  "scenarios",
  "scenario",
  "report",
  "inquiry",
  "method",
  "about",
] as const;

export type MeasurementSurface = (typeof MEASUREMENT_SURFACES)[number];

/** The events that are meaningless without the scenario they belong to. */
export const SCENARIO_SCOPED_EVENTS: readonly MeasurementEvent[] = [
  "scenario_viewed",
  "evidence_excerpt_opened",
  "comparison_viewed",
  "limitation_viewed",
  "scenario_step_advanced",
  "scenario_completed",
];

export function isScenarioScoped(event: MeasurementEvent): boolean {
  return SCENARIO_SCOPED_EVENTS.includes(event);
}
