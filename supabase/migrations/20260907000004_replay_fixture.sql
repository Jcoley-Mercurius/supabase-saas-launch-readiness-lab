-- =====================================================================
-- Synthetic webhook replay and reliability fixture.
--
-- Trace: MPS-REQ-002 (payment/webhook events in the synthetic context),
--        MPS-REQ-006 (webhook replay or duplicate-delivery risk and the
--        remediated idempotency result), MPS-REQ-007 (a reliability or
--        recovery scenario with an explicit failure and recovery result),
--        MPS-REQ-012 (recoverable states), MPS-RULE-001 (synthetic only),
--        MPS-ACC-007/008; MTS SECURITY-ARCHITECTURE "handle replay, ordering,
--        retries, and idempotency" and "Vulnerable demonstration rule".
--
-- EVERY row here is invented. There is no real payment, provider, customer,
-- signing credential, or money movement. Nothing in this file contacts a
-- payment provider, and no external webhook endpoint exists: the deliveries
-- below are rows, and the "endpoint" is a PostgreSQL function.
--
-- Isolation boundary, and why there is not a single foreign key to the S2
-- fixture tables: synthetic.reset_fixture() truncates those five tables, and
-- PostgreSQL refuses to truncate a table that a foreign key references. A
-- reference from here would therefore break the S2 reset path. The invoice is
-- carried as its number and the tenant as its uuid, matching the S2 seed by
-- value, so the two fixtures stay legible together and independent in the
-- database. Both live in `synthetic` and neither can reach `public`.
--
-- Determinism: nothing below reads now(), random(), or a sequence. Every
-- timestamp is the delivery's own logical event time and every generated
-- identifier is derived from the delivery it came from, so re-recording from
-- a clean database reproduces the transcript byte for byte.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Signing material
--
-- A provider signs each delivery and the receiver recomputes the signature to
-- prove the body was not forged or altered. This fixture reproduces that
-- shape with md5 over a canonical payload string, because the fixture runs
-- without pgcrypto and needs no cryptographic strength to demonstrate the
-- control: what is being proven is that the receiver CHECKS, not that md5 is
-- a good MAC. It is not one. A real integration must verify the provider's
-- HMAC-SHA256 signature with the provider's own library, and that limitation
-- is stated to the buyer wherever this evidence appears.
--
-- The value below is invented and is not a credential. It is deliberately
-- self-describing so that if it ever appeared in output, a reader would know
-- immediately that nothing real leaked. The recorder additionally fails if it
-- ever reaches the transcript.
-- ---------------------------------------------------------------------

create table synthetic.webhook_signing_material (
  id       boolean primary key default true check (id),
  material text not null
);

insert into synthetic.webhook_signing_material (id, material)
values (true, 'synthetic-signing-material-not-a-real-credential');

revoke all on synthetic.webhook_signing_material from anon, authenticated;

comment on table synthetic.webhook_signing_material is
  'Invented signing string for the synthetic webhook fixture. Not a credential and not reachable by any application role.';

-- ---------------------------------------------------------------------
-- Inbound deliveries
--
-- The distinction the whole scenario turns on:
--
--   delivery_id  identifies one HTTP delivery attempt series. A provider that
--                RETRIES a failed delivery reuses this id.
--   event_id     identifies the logical event. A provider that REPLAYS an
--                event — from its dashboard, a backfill, or an at-least-once
--                redelivery — sends a NEW delivery_id carrying the SAME
--                event_id.
--
-- A receiver that deduplicates on the delivery id therefore suppresses the
-- retry it needed to honour and accepts the replay it needed to reject. That
-- is the defect the vulnerable configuration reproduces.
-- ---------------------------------------------------------------------

create table synthetic.webhook_deliveries (
  delivery_id     text primary key,
  event_id        text not null,
  tenant_id       uuid not null,
  event_type      text not null,
  invoice_number  text not null,
  amount_cents    integer not null check (amount_cents >= 0),
  -- The provider's per-object version. A lower number arriving later is a
  -- superseded event and must not overwrite the newer state.
  sequence_number integer not null check (sequence_number > 0),
  occurred_at     timestamptz not null,
  -- The signature the provider sent. Correct for every delivery except the
  -- forged one, which carries a value that will not recompute.
  signature       text not null,
  -- Deterministic failure injection. The named fault fires on the first
  -- `fault_attempts` attempts of this delivery and not afterwards, which is
  -- what makes "the dependency was restored" reproducible rather than random.
  fault           text not null default 'none'
                    check (fault in ('none', 'downstream_unavailable')),
  fault_attempts  integer not null default 0 check (fault_attempts >= 0)
);

revoke all on synthetic.webhook_deliveries from anon, authenticated;

-- The idempotency ledger. Which value lands in ledger_key is the configuration
-- under test, so the column is deliberately generic and key_kind records the
-- choice that was actually made.
create table synthetic.processed_events (
  ledger_key        text primary key,
  key_kind          text not null check (key_kind in ('delivery_id', 'event_id')),
  event_id          text not null,
  first_delivery_id text not null,
  processed_at      timestamptz not null,
  outcome           text not null
);

revoke all on synthetic.processed_events from anon, authenticated;

-- What the handler actually commits. In a real system this is the row that
-- charges a card, extends a subscription, or releases an order; here it is
-- simply a row, and its duplication is the harm being demonstrated.
create table synthetic.payment_commitments (
  id             text primary key,
  tenant_id      uuid not null,
  invoice_number text not null,
  event_id       text not null,
  delivery_id    text not null,
  attempt        integer not null,
  amount_cents   integer not null,
  committed_at   timestamptz not null
);

revoke all on synthetic.payment_commitments from anon, authenticated;

-- Highest provider sequence applied per invoice, used by the ordering guard.
create table synthetic.applied_sequence (
  invoice_number text primary key,
  last_sequence  integer not null,
  last_amount_cents integer not null
);

revoke all on synthetic.applied_sequence from anon, authenticated;

-- Delivery attempt counter. Maintained by the sequence runner rather than by
-- the handler: an attempt is the provider's bookkeeping, and it must survive
-- a handler failure that rolls the delivery back, or a retry would be
-- attempt 1 forever and could never leave the fault window.
create table synthetic.delivery_attempts (
  delivery_id text primary key,
  attempts    integer not null
);

revoke all on synthetic.delivery_attempts from anon, authenticated;

-- ---------------------------------------------------------------------
-- Handler configuration
--
-- The two documented configurations differ only in these four facts, and the
-- handler branches on this row rather than on a mode name. That means the row
-- the buyer is shown IS the thing under test: it cannot describe a handler
-- that was not the one that ran.
-- ---------------------------------------------------------------------

create table synthetic.replay_configuration (
  id               boolean primary key default true check (id),
  mode             text not null check (mode in ('vulnerable', 'remediated')),
  -- Recompute the provider signature and refuse a delivery that fails it.
  verify_signature boolean not null,
  -- Which identifier the idempotency ledger is keyed on.
  ledger_key       text not null check (ledger_key in ('delivery_id', 'event_id')),
  -- Refuse a delivery whose provider sequence is not newer than the applied one.
  enforce_order    boolean not null,
  -- Claim the ledger and perform the commitment as one unit, so a downstream
  -- failure rolls back both. When false the handler marks the event processed
  -- first and treats the commitment as best effort.
  atomic_commit    boolean not null
);

revoke all on synthetic.replay_configuration from anon, authenticated;

-- ---------------------------------------------------------------------
-- Signature computation
-- ---------------------------------------------------------------------

create or replace function synthetic.canonical_payload(p_delivery_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select d.event_id || '|' || d.event_type || '|' || d.invoice_number || '|'
         || d.amount_cents::text || '|' || d.sequence_number::text
  from synthetic.webhook_deliveries d
  where d.delivery_id = p_delivery_id;
$$;

create or replace function synthetic.expected_signature(p_delivery_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select md5(m.material || '|' || synthetic.canonical_payload(p_delivery_id))
  from synthetic.webhook_signing_material m;
$$;

revoke all on function synthetic.canonical_payload(text)  from public, anon, authenticated;
revoke all on function synthetic.expected_signature(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Deterministic seed
-- ---------------------------------------------------------------------

create or replace function synthetic.seed_replay_fixture()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Signatures are filled in below from the signing material, so a hand-typed
  -- digest can never drift from the payload it is supposed to cover.
  insert into synthetic.webhook_deliveries
    (delivery_id, event_id, tenant_id, event_type, invoice_number,
     amount_cents, sequence_number, occurred_at, signature, fault, fault_attempts)
  values
    -- Duplicate delivery of one logical event (WHK-001).
    ('del_nw2041_a', 'evt_nw2041_paid', '11111111-1111-4111-8111-111111111111',
     'invoice.paid', 'NW-2041', 148000, 1, '2026-03-02T09:15:00Z', 'pending', 'none', 0),
    ('del_nw2041_b', 'evt_nw2041_paid', '11111111-1111-4111-8111-111111111111',
     'invoice.paid', 'NW-2041', 148000, 1, '2026-03-02T09:15:00Z', 'pending', 'none', 0),

    -- Forged delivery: the body was altered after signing (WHK-002). The
    -- signature is left as an invented value that cannot recompute.
    ('del_nw2042_forged', 'evt_nw2042_paid', '11111111-1111-4111-8111-111111111111',
     'invoice.paid', 'NW-2042', 32500, 1, '2026-03-02T10:04:00Z',
     '00000000000000000000000000000000', 'none', 0),

    -- Ordering: the newer event arrives first, the superseded one after
    -- (WHK-003). Both are correctly signed; only their order is wrong.
    ('del_hl0818_v2', 'evt_hl0818_paid_v2', '22222222-2222-4222-8222-222222222222',
     'invoice.paid', 'HL-0818', 15000, 2, '2026-03-02T11:31:00Z', 'pending', 'none', 0),
    ('del_hl0818_v1', 'evt_hl0818_paid_v1', '22222222-2222-4222-8222-222222222222',
     'invoice.paid', 'HL-0818', 9000, 1, '2026-03-02T11:29:00Z', 'pending', 'none', 0),

    -- A clean, correctly signed, first-time delivery (WHK-004): the path that
    -- must keep working after the fix.
    ('del_hl0817_clean', 'evt_hl0817_paid', '22222222-2222-4222-8222-222222222222',
     'invoice.paid', 'HL-0817', 91200, 1, '2026-03-02T12:00:00Z', 'pending', 'none', 0),

    -- One transient downstream failure, then the provider retries the same
    -- delivery (REL-001).
    ('del_hl0817_flaky', 'evt_hl0817_settled', '22222222-2222-4222-8222-222222222222',
     'invoice.paid', 'HL-0817', 91200, 2, '2026-03-02T13:20:00Z', 'pending',
     'downstream_unavailable', 1),

    -- A sustained outage across three attempts, then recovery (REL-002).
    ('del_nw2042_outage', 'evt_nw2042_settled', '11111111-1111-4111-8111-111111111111',
     'invoice.paid', 'NW-2042', 32500, 1, '2026-03-02T14:05:00Z', 'pending',
     'downstream_unavailable', 3),

    -- A failure, its retry, and then a dashboard replay of the same logical
    -- event after recovery (REL-003).
    ('del_hl0818_flaky', 'evt_hl0818_settled', '22222222-2222-4222-8222-222222222222',
     'invoice.paid', 'HL-0818', 15000, 3, '2026-03-02T15:10:00Z', 'pending',
     'downstream_unavailable', 1),
    ('del_hl0818_replay', 'evt_hl0818_settled', '22222222-2222-4222-8222-222222222222',
     'invoice.paid', 'HL-0818', 15000, 3, '2026-03-02T15:10:00Z', 'pending', 'none', 0),

    -- An unrelated event delivered during the outage window (REL-004).
    ('del_nw2041_c', 'evt_nw2041_settled', '11111111-1111-4111-8111-111111111111',
     'invoice.paid', 'NW-2041', 148000, 2, '2026-03-02T14:06:00Z', 'pending', 'none', 0);

  update synthetic.webhook_deliveries d
     set signature = synthetic.expected_signature(d.delivery_id)
   where d.signature = 'pending';
end;
$$;

-- ---------------------------------------------------------------------
-- Safe reset
--
-- The relation list is literal. There is no dynamic SQL and no schema
-- argument, so this cannot reach a relation outside `synthetic` — including
-- the five S2 fixture tables and the public inquiry store S5 will add.
-- ---------------------------------------------------------------------

create or replace function synthetic.reset_replay_fixture()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  truncate table
    synthetic.payment_commitments,
    synthetic.processed_events,
    synthetic.applied_sequence,
    synthetic.delivery_attempts,
    synthetic.webhook_deliveries;

  perform synthetic.seed_replay_fixture();
end;
$$;

comment on function synthetic.reset_replay_fixture() is
  'Truncates and reseeds only the five synthetic replay tables. Cannot reference any relation outside the synthetic schema, and does not touch the S2 fixture tables.';

-- ---------------------------------------------------------------------
-- Mode switch — an allowlist of exactly two names, as in the policy modes.
-- ---------------------------------------------------------------------

create or replace function synthetic.apply_replay_mode(mode text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if mode = 'vulnerable' then
    insert into synthetic.replay_configuration
      (id, mode, verify_signature, ledger_key, enforce_order, atomic_commit)
    values (true, 'vulnerable', false, 'delivery_id', false, false)
    on conflict (id) do update
      set mode             = excluded.mode,
          verify_signature = excluded.verify_signature,
          ledger_key       = excluded.ledger_key,
          enforce_order    = excluded.enforce_order,
          atomic_commit    = excluded.atomic_commit;
  elsif mode = 'remediated' then
    insert into synthetic.replay_configuration
      (id, mode, verify_signature, ledger_key, enforce_order, atomic_commit)
    values (true, 'remediated', true, 'event_id', true, true)
    on conflict (id) do update
      set mode             = excluded.mode,
          verify_signature = excluded.verify_signature,
          ledger_key       = excluded.ledger_key,
          enforce_order    = excluded.enforce_order,
          atomic_commit    = excluded.atomic_commit;
  else
    raise exception 'unknown replay mode %; only vulnerable and remediated exist', mode
      using errcode = 'invalid_parameter_value';
  end if;

  perform synthetic.reset_replay_fixture();
end;
$$;

revoke all on function synthetic.seed_replay_fixture()  from public, anon, authenticated;
revoke all on function synthetic.reset_replay_fixture() from public, anon, authenticated;
revoke all on function synthetic.apply_replay_mode(text) from public, anon, authenticated;

select synthetic.apply_replay_mode('remediated');
