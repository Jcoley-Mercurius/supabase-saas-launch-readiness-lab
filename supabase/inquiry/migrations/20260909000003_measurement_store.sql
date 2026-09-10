-- =====================================================================
-- First-party measurement store.
--
-- Trace: MPS-MET-001 (proof comprehension), MPS-MET-002 (scenario
--        completion), MPS-MET-003 (qualified inquiry conversion),
--        MPS-MET-004 (proposal proof reuse), MPS-MET-005 (buyer signal
--        capture); MTS-CAP-008, MTS-DEC-016 (first-party only, no
--        third-party analytics provider), MTS-OBS-050 (placement);
--        MTS SECURITY-ARCHITECTURE ("enforce RLS and grants for every
--        exposed table", "exclude secrets from logs, analytics, URLs,
--        screenshots, and evidence").
--
-- WHY THIS IS ITS OWN SCHEMA, IN THIS PROJECT.
--
-- MTS-OBS-050 asked where first-party events belong. The isolated inquiry
-- project is the only hosted database this repository owns, and it exists
-- precisely to keep real buyer contact data apart from everything else. So
-- measurement lands here, but in its own `measurement` schema rather than in
-- `public` beside the inquiries:
--
--   * no foreign key from an event to an inquiry,
--   * no column that could carry an inquiry's id, dedupe key, or address,
--   * its own grants, revoked and granted explicitly rather than inherited.
--
-- The separation is the point of the placement, so it is asserted as a
-- property in supabase/inquiry/tests/measurement-checks.sql rather than left
-- as a convention this file merely describes.
--
-- WHAT AN EVENT MAY NOT CARRY.
--
-- MTS-DEC-016 binds the boundary regardless of destination: no inquiry text,
-- no secret, no credential, no raw evidence payload, and no value that
-- identifies a person. This schema enforces that structurally rather than
-- trusting the caller — every column is either a timestamp, a bounded integer,
-- or a value drawn from a CLOSED SET checked by the database. There is no free
-- text column anywhere in this table, so there is nowhere for an address, a
-- name, a review request, or a key to be written even by a caller that tries.
--
-- That is deliberate and it is the whole design. A `properties jsonb` column
-- would have been more flexible and would have made MPS-RULE and MTS-DEC-016
-- unenforceable by anything except review.
--
-- There is also no session id, no visitor id, no cookie value, and no IP
-- address. MTS-OBS-037 already rejected address-based abuse control because an
-- IP is personal data this product has no approved basis to hold; the same
-- reasoning applies with more force to analytics.
--
-- WHAT THAT COSTS, STATED PLAINLY.
--
-- Without a visitor identifier these counts are event counts, not unique
-- visitors, and not per-person funnels. MPS-MET-002 and MPS-MET-003 are
-- therefore ratios between event totals over a period, which is a weaker
-- instrument than a joined funnel. That is the accepted cost of holding no
-- identifier, and any figure derived from this table must be described as what
-- it is rather than reported as unique users.
-- =====================================================================

create schema if not exists measurement;

comment on schema measurement is
  'First-party product measurement. Holds no inquiry content, no identifier, and no free text. Separated from public by MTS-OBS-050.';

-- ---------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------

create table if not exists measurement.events (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default now(),

  -- The closed event taxonomy. A name outside this list is rejected by the
  -- database, so the taxonomy cannot drift by a caller inventing a name.
  event_name    text        not null,

  -- Which approved surface produced the event. A route CLASS, never a URL:
  -- a scenario URL names the vulnerability class being demonstrated, and a
  -- full path is the kind of value that quietly becomes an identifier.
  surface       text        not null,

  -- The scenario a scenario-scoped event belongs to, drawn from the approved
  -- catalogue. Null for events that are not scenario-scoped.
  scenario_slug text,

  environment   text        not null,

  constraint events_name_known check (
    event_name in (
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
  ),

  constraint events_surface_known check (
    surface in ('landing', 'scenarios', 'scenario', 'report', 'inquiry', 'method', 'about')
  ),

  -- The approved scenario catalogue. Kept as a check rather than a foreign key
  -- on purpose: a foreign key would need a scenarios table in this database,
  -- and the scenario catalogue belongs to the evidence fixture, which this
  -- project must not be able to see (MTS-RISK-001 residual).
  constraint events_scenario_known check (
    scenario_slug is null
    or scenario_slug in (
      'authorization-and-rls',
      'storage-and-configuration',
      'webhook-integrity',
      'reliability-and-recovery'
    )
  ),

  -- A scenario-scoped event without its scenario is not a usable measurement,
  -- and a non-scenario event carrying one is a caller mistake worth failing on.
  constraint events_scenario_scope_matches check (
    (event_name in (
      'scenario_viewed', 'evidence_excerpt_opened', 'comparison_viewed',
      'limitation_viewed', 'scenario_step_advanced', 'scenario_completed'
    ) and scenario_slug is not null)
    or
    (event_name not in (
      'scenario_viewed', 'evidence_excerpt_opened', 'comparison_viewed',
      'limitation_viewed', 'scenario_step_advanced', 'scenario_completed'
    ) and scenario_slug is null)
  ),

  constraint events_environment_known check (
    environment in ('local', 'preview', 'production')
  )
);

comment on table measurement.events is
  'First-party product events. Every column is a timestamp or a closed-set value; there is no free text and no identifier, so inquiry content and secrets have nowhere to be written.';
comment on column measurement.events.surface is
  'Route class, never a URL. A scenario path names the vulnerability class being demonstrated.';

create index if not exists events_name_occurred_idx
  on measurement.events (event_name, occurred_at desc);
create index if not exists events_occurred_idx
  on measurement.events (occurred_at);

-- ---------------------------------------------------------------------
-- Denial. Both directions, exactly as the inquiry store does it.
-- ---------------------------------------------------------------------

alter table measurement.events enable row level security;

-- No policy is created. With RLS enabled and no policy, every row is denied to
-- every non-owner role for every command — so even if a grant were added by
-- mistake later, there is still no readable row.

revoke all on measurement.events from public, anon, authenticated;
revoke all on schema measurement from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- The entire reachable surface: one write-only function.
-- ---------------------------------------------------------------------

-- There is no read function. A count is an operator question answered against
-- the database directly; exposing an aggregate to the public key would be a
-- read path into a table whose whole design is that it has none.
create or replace function measurement.record_event(
  p_event_name    text,
  p_surface       text,
  p_scenario_slug text,
  p_environment   text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Every argument is checked by the table's own constraints. This function
  -- adds no validation of its own precisely so that there is one place where
  -- the taxonomy is defined, and it is the database.
  insert into measurement.events (event_name, surface, scenario_slug, environment)
  values (p_event_name, p_surface, nullif(p_scenario_slug, ''), p_environment);
end;
$$;

comment on function measurement.record_event(text, text, text, text) is
  'The only reachable measurement surface. Write-only: it returns nothing and there is no read path from a public role.';

-- ---------------------------------------------------------------------
-- Privileges.
--
-- MTS-OBS-044: a hosted Supabase project ships
--   alter default privileges in schema public grant all on functions
--     to anon, authenticated, service_role
-- so a function created there is born with a DIRECT execute grant to the
-- application roles, and `revoke ... from public` does not remove a direct
-- grant. That default is scoped to schema `public` and this function is in
-- `measurement`, so it should not apply here — but "should not" is exactly the
-- reasoning that produced MTS-OBS-044 in the first place. The revoke below
-- names the roles explicitly regardless, and the deny assertions are re-run
-- against the hosted project rather than assumed from the local result.
-- ---------------------------------------------------------------------

revoke all on function measurement.record_event(text, text, text, text)
  from public, anon, authenticated;

grant usage on schema measurement to anon;
grant execute on function measurement.record_event(text, text, text, text) to anon;
