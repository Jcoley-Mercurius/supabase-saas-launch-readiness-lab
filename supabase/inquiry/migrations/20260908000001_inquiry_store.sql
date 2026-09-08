-- =====================================================================
-- Authorized-review inquiry store.
--
-- Trace: MPS-REQ-010 (role, stack, launch trigger, desired review, contact
--        method, authorization status), MPS-REQ-011 (acknowledge only after a
--        successful submission), MPS-REQ-012 (duplicate and failure are
--        recoverable states), MPS-REQ-013 (no credential or production data),
--        MPS-REQ-015 / MPS-RULE-008 / MPS-ACC-016 (12 months, earlier manual
--        deletion, minimal deduplication metadata afterwards),
--        MPS-RULE-005/006;
--        MTS INTEGRATION-MANIFEST ("public.inquiries",
--        "public.inquiry_delivery_events"), MTS SECURITY-ARCHITECTURE
--        ("validate server-side", "rate limiting or abuse controls BEFORE
--        persistence and notification", "deduplicate using a bounded key",
--        "enforce RLS and grants for every exposed table", "keep production
--        inquiry data separate from synthetic fixtures and reset commands").
--
-- ISOLATION BOUNDARY — the reason this file is not in supabase/migrations.
--
-- The synthetic audit fixture lives entirely in the `synthetic` schema and is
-- built, reset, and re-recorded by supabase/migrations plus the offline
-- recorder. Inquiry data is real buyer contact data and must never be reachable
-- by a reset command, a documented test, or the evidence recorder. So this
-- migration set is a SEPARATE set, applied to a SEPARATE Supabase project, and
-- deliberately excluded from the recorder's input digest: an inquiry schema
-- change must not invalidate published evidence, and an evidence reset must not
-- be able to see, let alone truncate, an inquiry.
--
-- Nothing in this file references the `synthetic` schema. Nothing in
-- supabase/migrations references `public.inquiries`.
--
-- AUTHORIZATION MODEL — no table is exposed at all.
--
-- Both tables have RLS enabled and NO policy, and every privilege is revoked
-- from PUBLIC, `anon`, and `authenticated`. That is two independent denials:
-- with no grant the request never reaches the table, and with RLS on and no
-- policy every row is invisible even if a grant were added by mistake.
--
-- The only reachable surface is two SECURITY DEFINER functions with a fixed
-- empty search_path. They accept a closed set of scalar arguments, return the
-- minimum a buyer needs to see a truthful state, and never return inquiry
-- content. There is therefore no read path to an inquiry from the public key
-- at all — not a filtered one, not an aggregate one.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.inquiries (
  id                    uuid primary key default gen_random_uuid(),

  -- Deduplication key. A bounded, opaque, fixed-length digest of the
  -- normalized contact address — never the address itself — so that the one
  -- column allowed to outlive redaction carries no readable contact data
  -- (MPS-RULE-008: "minimal operational deduplication metadata").
  dedupe_key            text        not null,

  submitted_at          timestamptz not null default now(),
  -- "12 months after LATEST ACTIVITY" (MPS-REQ-015). A repeat submission or an
  -- operator touch moves this forward; retention is measured from it.
  last_activity_at      timestamptz not null default clock_timestamp(),
  submission_count      integer     not null default 1,

  -- Inquiry content. Every one of these is nulled at redaction.
  contact_name          text,
  contact_email         text,
  organization          text,
  buyer_role            text,
  stack_summary         text,
  launch_trigger        text,
  review_areas          text[],
  review_request        text,
  authorization_status  text,

  -- Operational metadata. Survives redaction; contains no inquiry content.
  environment           text        not null,
  delivery_status       text        not null default 'pending',
  redacted_at           timestamptz,

  constraint inquiries_delivery_status_known check (
    delivery_status in ('pending', 'sent', 'failed')
  ),
  constraint inquiries_authorization_status_known check (
    redacted_at is not null
    or authorization_status in (
      'authorized-by-me', 'client-authorization-required', 'not-yet-determined'
    )
  ),
  constraint inquiries_environment_known check (
    environment in ('local', 'preview', 'production')
  ),
  -- A redacted row holds no content. Enforced by the database rather than
  -- trusted to the function, so MPS-ACC-016 cannot be defeated by a later
  -- code path that forgets one column.
  constraint inquiries_redacted_rows_hold_no_content check (
    redacted_at is null
    or (
      contact_name is null and contact_email is null and organization is null
      and buyer_role is null and stack_summary is null and launch_trigger is null
      and review_areas is null and review_request is null
      and authorization_status is null
    )
  )
);

comment on table public.inquiries is
  'Authorized-review inquiries. Real contact data: isolated from the synthetic audit fixture, never reset by an evidence command, redacted at 12 months after latest activity.';
comment on column public.inquiries.dedupe_key is
  'Opaque bounded digest of the normalized contact address. The only column that may survive redaction, and it is not reversible to an address.';
comment on column public.inquiries.last_activity_at is
  'Retention clock. MPS-REQ-015 measures 12 months from latest activity, not from submission.';

create index if not exists inquiries_dedupe_key_activity_idx
  on public.inquiries (dedupe_key, last_activity_at desc);
create index if not exists inquiries_last_activity_idx
  on public.inquiries (last_activity_at);

create table if not exists public.inquiry_delivery_events (
  id             uuid primary key default gen_random_uuid(),
  inquiry_id     uuid        not null references public.inquiries (id) on delete cascade,
  occurred_at    timestamptz not null default now(),
  outcome        text        not null,
  -- A coarse class only: 'transport', 'rejected', 'unconfigured', 'unknown'.
  -- Never a provider payload, message body, header, address, or key.
  failure_class  text,

  constraint delivery_outcome_known check (outcome in ('sent', 'failed')),
  constraint delivery_failure_class_known check (
    failure_class is null
    or failure_class in ('transport', 'rejected', 'unconfigured', 'unknown')
  )
);

comment on table public.inquiry_delivery_events is
  'Minimal operational delivery metadata. Holds no message content, no address, no provider payload, and no secret.';

-- ---------------------------------------------------------------------
-- Denial. Both directions.
-- ---------------------------------------------------------------------

alter table public.inquiries              enable row level security;
alter table public.inquiry_delivery_events enable row level security;

-- No policy is created on either table. With RLS enabled and no policy, every
-- row is denied to every non-owner role, for every command.

revoke all on public.inquiries               from public, anon, authenticated;
revoke all on public.inquiry_delivery_events from public, anon, authenticated;
