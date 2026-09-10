-- =====================================================================
-- Adds the landing view to the measurement taxonomy.
--
-- Trace: MPS-MET-003 (qualified inquiry conversion — "divided by unique
--        visitors"), MPS-MET-001 (proof comprehension); MTS-CAP-008,
--        MTS-DEC-016, MTS-OBS-050.
--
-- WHY A MIGRATION RATHER THAN A LINE OF TYPESCRIPT.
--
-- 20260909000003 made the database the definition of the taxonomy on purpose:
-- a name outside the check constraint is rejected whatever this repository
-- believes, so a caller cannot invent an event. That property is only worth
-- having if adding a name goes through here first. The TypeScript list in
-- lib/measurement/events.ts is the mirror, and
-- tests/unit/measurement-boundary.spec.ts fails if the two drift.
--
-- WHY THIS NAME EXISTS AT ALL.
--
-- `surface = 'landing'` was accepted from the start, but no event name could
-- ever carry it, so the busiest page in the product emitted nothing and the
-- funnel had no first step. MPS-MET-003 is defined as qualified inquiries
-- "divided by unique visitors"; this schema holds no visitor identifier by
-- design (MTS-OBS-050), so the honest denominator available here is a count of
-- landing views. It is NOT a unique-visitor count and must never be reported
-- as one — a repeat visitor is indistinguishable from a new one, which is the
-- accepted cost recorded in MTS-CHG-019.
--
-- Not scenario-scoped: events_scenario_scope_matches already requires a null
-- scenario_slug for any name outside the scoped list, so a landing view
-- carrying a scenario is rejected without changing that constraint.
-- =====================================================================

alter table measurement.events
  drop constraint if exists events_name_known;

alter table measurement.events
  add constraint events_name_known check (
    event_name in (
      -- MPS-MET-003 funnel entry — the first step, and a count of views
      -- rather than of people
      'landing_viewed',
      -- MPS-MET-001 proof comprehension
      'scenario_viewed',
      'evidence_excerpt_opened',
      'comparison_viewed',
      'limitation_viewed',
      -- MPS-MET-002 scenario completion
      'scenario_step_advanced',
      'scenario_completed',
      -- MPS-MET-004 proposal proof reuse
      'report_viewed',
      'report_section_opened',
      'report_printed',
      -- MPS-MET-003 and MPS-MET-005
      'inquiry_started',
      'inquiry_submitted',
      'inquiry_acknowledged'
    )
  );
