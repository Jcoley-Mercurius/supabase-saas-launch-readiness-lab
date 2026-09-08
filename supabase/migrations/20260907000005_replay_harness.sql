-- =====================================================================
-- Webhook delivery handler and documented-sequence harness.
--
-- Trace: MPS-REQ-006/007/012, MPS-ACC-007/008/014; MTS SECURITY-ARCHITECTURE
--        "handle replay, ordering, retries, and idempotency".
--
-- Boundary: this is offline developer tooling, exactly as the S2 harness is.
-- Every function here is revoked from anon and authenticated, the sequence
-- registry is readable only by the fixture owner, and the deployed
-- application opens no database connection at all. The recorded output of
-- this harness — not the harness — is what ships.
-- =====================================================================

-- ---------------------------------------------------------------------
-- The handler under test
--
-- One function, two documented configurations. It branches on
-- synthetic.replay_configuration rather than on a mode name, so the
-- configuration row shown to the buyer is the same row the handler read.
--
-- The four decisions it can reach are named, never inferred, and the caller
-- records them verbatim.
-- ---------------------------------------------------------------------

create or replace function synthetic.handle_delivery(
  p_delivery_id text,
  p_attempt     integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg        synthetic.replay_configuration%rowtype;
  d          synthetic.webhook_deliveries%rowtype;
  -- v_ prefix: a bare `ledger_key` would be ambiguous against the column of
  -- the same name inside the INSERT below (SQLSTATE 42702).
  v_ledger_key text;
  claimed    integer;
  applied    synthetic.applied_sequence%rowtype;
  fault_fires boolean;
begin
  select * into cfg from synthetic.replay_configuration where id;
  select * into d from synthetic.webhook_deliveries where delivery_id = p_delivery_id;
  if not found then
    raise exception 'unknown delivery %', p_delivery_id using errcode = 'invalid_parameter_value';
  end if;

  -- 1. Authenticity. A receiver that does not recompute the signature will
  --    accept anything posted to the endpoint URL.
  if cfg.verify_signature
     and d.signature is distinct from synthetic.expected_signature(p_delivery_id) then
    return jsonb_build_object(
      'decision', 'rejected_invalid_signature',
      'detail',   'The recomputed signature did not match the one the caller sent, so the body was not accepted and no state changed.');
  end if;

  v_ledger_key := case cfg.ledger_key
                  when 'event_id' then d.event_id
                  else d.delivery_id
                end;

  -- 2. Ordering. Strictly-greater, on purpose: a superseded event carries a
  --    LOWER sequence and must be refused, while a retry or replay of the
  --    current event carries the SAME sequence and must fall through to the
  --    idempotency check below, so that it is reported as a duplicate rather
  --    than as an ordering problem.
  if cfg.enforce_order then
    select * into applied from synthetic.applied_sequence a
      where a.invoice_number = d.invoice_number;
    if found and applied.last_sequence > d.sequence_number then
      return jsonb_build_object(
        'decision', 'rejected_out_of_order',
        'detail',   format(
          'Sequence %s for %s has already been applied, so this superseded sequence %s event was refused and the newer state was left in place.',
          applied.last_sequence, d.invoice_number, d.sequence_number));
    end if;
  end if;

  fault_fires := d.fault = 'downstream_unavailable' and p_attempt <= d.fault_attempts;

  if cfg.atomic_commit then
    -- Remediated shape. The ledger claim and the commitment are one unit of
    -- work: if the commitment cannot be made, the claim is rolled back with
    -- it, so the event stays eligible for the provider's retry.
    insert into synthetic.processed_events
      (ledger_key, key_kind, event_id, first_delivery_id, processed_at, outcome)
    values
      (v_ledger_key, cfg.ledger_key, d.event_id, d.delivery_id, d.occurred_at, 'committed')
    on conflict (ledger_key) do nothing;
    get diagnostics claimed = row_count;

    if claimed = 0 then
      return jsonb_build_object(
        'decision', 'skipped_duplicate',
        'detail',   format(
          'The idempotency ledger already held logical event %s, so this delivery was acknowledged without committing anything a second time.',
          d.event_id));
    end if;

    if fault_fires then
      -- Raised, not swallowed. The caller's savepoint unwinds the ledger claim
      -- along with the commitment that never happened.
      raise exception 'downstream payment ledger unavailable'
        using errcode = 'connection_failure';
    end if;

    perform synthetic.commit_payment(d, p_attempt);

    return jsonb_build_object(
      'decision', 'committed',
      'detail',   format(
        'Logical event %s was claimed in the idempotency ledger and one commitment of %s cents was recorded for %s.',
        d.event_id, d.amount_cents, d.invoice_number));
  end if;

  -- Vulnerable shape. The event is marked processed BEFORE the work, and the
  -- work is best effort: any error is swallowed and the delivery is still
  -- acknowledged as a success to the provider.
  insert into synthetic.processed_events
    (ledger_key, key_kind, event_id, first_delivery_id, processed_at, outcome)
  values
    (v_ledger_key, cfg.ledger_key, d.event_id, d.delivery_id, d.occurred_at, 'marked_processed')
  on conflict (ledger_key) do nothing;
  get diagnostics claimed = row_count;

  if claimed = 0 then
    return jsonb_build_object(
      'decision', 'skipped_duplicate',
      'detail',   format(
        'The ledger already held delivery id %s, so this attempt was discarded — including when it was the provider retrying work that never completed.',
        d.delivery_id));
  end if;

  begin
    if fault_fires then
      raise exception 'downstream payment ledger unavailable'
        using errcode = 'connection_failure';
    end if;
    perform synthetic.commit_payment(d, p_attempt);
  exception
    -- Narrowed to the injected fault for the same reason as the runner below:
    -- the vulnerable behaviour being demonstrated is that a DOWNSTREAM failure
    -- is swallowed, and catching everything would also swallow a defect in
    -- this harness and publish it as evidence.
    when connection_failure then
      return jsonb_build_object(
        'decision', 'failed_after_marking_processed',
        'detail',   format(
          'The commitment failed (%s) but the error was swallowed and logical event %s remains marked processed, so no retry will ever be accepted.',
          sqlerrm, d.event_id));
  end;

  return jsonb_build_object(
    'decision', 'committed',
    'detail',   format(
      'Delivery %s was recorded in the ledger and one commitment of %s cents was made for %s.',
      d.delivery_id, d.amount_cents, d.invoice_number));
end;
$$;

-- The commitment itself. Split out so both configurations perform exactly the
-- same write, and the only difference between them is when and whether it is
-- reached.
create or replace function synthetic.commit_payment(
  d         synthetic.webhook_deliveries,
  p_attempt integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into synthetic.payment_commitments
    (id, tenant_id, invoice_number, event_id, delivery_id, attempt, amount_cents, committed_at)
  values
    (d.delivery_id || '#' || p_attempt::text, d.tenant_id, d.invoice_number,
     d.event_id, d.delivery_id, p_attempt, d.amount_cents, d.occurred_at);

  insert into synthetic.applied_sequence (invoice_number, last_sequence, last_amount_cents)
  values (d.invoice_number, d.sequence_number, d.amount_cents)
  on conflict (invoice_number) do update
    set last_sequence     = greatest(synthetic.applied_sequence.last_sequence, excluded.last_sequence),
        last_amount_cents = excluded.last_amount_cents;
end;
$$;

revoke all on function synthetic.handle_delivery(text, integer)                       from public, anon, authenticated;
revoke all on function synthetic.commit_payment(synthetic.webhook_deliveries, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Documented sequence registry
--
-- A replay or recovery claim cannot be made by one statement: it is a claim
-- about what a SEQUENCE of deliveries leaves behind. Each sequence therefore
-- declares its expected end state numerically, so "the same logical event did
-- not create a duplicate commitment" is a counted fact rather than a reading
-- of the log.
-- ---------------------------------------------------------------------

create table synthetic.documented_sequences (
  id                      text primary key,
  scenario_id             text not null,
  ordinal                 integer not null,
  title                   text not null,
  intent                  text not null,
  consequence             text not null,
  -- The invoice whose end state the expectation is stated about.
  target_invoice          text not null,
  expected_commitments    integer not null check (expected_commitments >= 0),
  expected_applied_cents  integer not null check (expected_applied_cents >= 0),
  expectation_text        text not null,
  -- 'deny' — the incorrect outcome must not occur; 'allow' — the legitimate
  -- path must keep working. Same vocabulary as the S2 documented tests, so
  -- both slices map a recorded result onto an evidence state identically.
  expectation             text not null check (expectation in ('allow', 'deny')),
  unique (scenario_id, ordinal)
);

create table synthetic.documented_steps (
  sequence_id text not null references synthetic.documented_sequences (id) on delete cascade,
  ordinal     integer not null,
  -- Deliberately NOT a foreign key. synthetic.reset_replay_fixture() truncates
  -- synthetic.webhook_deliveries, and PostgreSQL refuses to truncate a table a
  -- foreign key references. An unknown delivery id is caught instead by the
  -- registry check in supabase/tests/safety-checks.sql.
  delivery_id text not null,
  label       text not null,
  note        text not null,
  -- Optional checkpoint: how many commitments must exist for the sequence's
  -- target invoice immediately after this step.
  --
  -- This exists because an end-state count alone can be met by accident. In
  -- REL-003 the vulnerable configuration loses the retry AND double-counts the
  -- later replay, and the two errors cancel: the final count is right while
  -- every individual decision was wrong. A checkpoint on the recovery step
  -- makes the sequence assert what actually has to be true at the moment it
  -- has to be true, so a configuration cannot pass by compensating error.
  expected_commitments_after integer check (expected_commitments_after >= 0),
  primary key (sequence_id, ordinal)
);

revoke all on synthetic.documented_sequences, synthetic.documented_steps from anon, authenticated;

-- ---------------------------------------------------------------------
-- Sequence runner
--
-- Each step runs inside its own exception block, which PostgreSQL implements
-- as a savepoint. That is what gives the remediated configuration its
-- meaning: when the handler raises, the ledger claim it had just made is
-- unwound with the commitment that never happened, and the rest of the
-- sequence still runs. The attempt counter is incremented outside that block
-- so a retry is genuinely attempt 2.
-- ---------------------------------------------------------------------

create or replace function synthetic.run_documented_sequence(p_sequence_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s          synthetic.documented_sequences%rowtype;
  st         synthetic.documented_steps%rowtype;
  d          synthetic.webhook_deliveries%rowtype;
  cfg        synthetic.replay_configuration%rowtype;
  attempt    integer;
  outcome    jsonb;
  steps      jsonb := '[]'::jsonb;
  observed_commitments integer;
  observed_cents       integer;
  ledger_rows          integer;
  checkpoint_met       boolean;
  checkpoints_held     boolean := true;
  met        boolean;
begin
  select * into s from synthetic.documented_sequences where id = p_sequence_id;
  if not found then
    raise exception 'unknown documented sequence %', p_sequence_id
      using errcode = 'invalid_parameter_value';
  end if;

  -- Every sequence starts from the same state, so one sequence can never
  -- inherit another's ledger or commitments.
  perform synthetic.reset_replay_fixture();
  select * into cfg from synthetic.replay_configuration where id;

  for st in
    select * from synthetic.documented_steps
     where sequence_id = p_sequence_id
     order by ordinal
  loop
    select * into d from synthetic.webhook_deliveries where delivery_id = st.delivery_id;

    insert into synthetic.delivery_attempts (delivery_id, attempts)
    values (st.delivery_id, 1)
    on conflict (delivery_id) do update
      set attempts = synthetic.delivery_attempts.attempts + 1
    returning attempts into attempt;

    begin
      outcome := synthetic.handle_delivery(st.delivery_id, attempt);
    exception
      -- ONLY the injected downstream fault is caught here.
      --
      -- `when others` would be a quiet way to publish a false result: a bug in
      -- the handler or a typo in a documented sequence raises too, and would
      -- be recorded as a legitimate rollback — which is precisely what correct
      -- recovery behaviour looks like from outside. It happened once during
      -- development, and only the commitment counts gave it away. Anything
      -- that is not the injected fault must fail the recording loudly.
      when connection_failure then
        -- The handler raised, so everything it did in this step is rolled
        -- back to the implicit savepoint. That is the recovery-critical
        -- behaviour, and it is recorded as what it is rather than as an
        -- error in the harness.
        outcome := jsonb_build_object(
          'decision', 'failed_and_rolled_back',
          'detail',   format(
            'The handler could not complete (%s), so the ledger claim and the commitment were both rolled back and logical event %s remains eligible for the provider''s retry.',
            sqlerrm, d.event_id),
          'error_code',    sqlstate,
          'error_message', sqlerrm);
    end;

    select count(*) into observed_commitments
      from synthetic.payment_commitments c where c.invoice_number = s.target_invoice;
    select coalesce(sum(c.amount_cents), 0) into observed_cents
      from synthetic.payment_commitments c where c.invoice_number = s.target_invoice;
    select count(*) into ledger_rows from synthetic.processed_events;

    checkpoint_met := case
      when st.expected_commitments_after is null then null
      else observed_commitments = st.expected_commitments_after
    end;
    checkpoints_held := checkpoints_held and coalesce(checkpoint_met, true);

    steps := steps || jsonb_build_array(jsonb_build_object(
      'ordinal',            st.ordinal,
      'label',              st.label,
      'note',               st.note,
      'delivery_id',        st.delivery_id,
      'event_id',           d.event_id,
      'invoice_number',     d.invoice_number,
      'sequence_number',    d.sequence_number,
      'amount_cents',       d.amount_cents,
      'attempt',            attempt,
      'signature_valid',    d.signature = synthetic.expected_signature(st.delivery_id),
      'decision',           outcome ->> 'decision',
      'detail',             outcome ->> 'detail',
      'error_code',         outcome ->> 'error_code',
      'error_message',      outcome ->> 'error_message',
      'expected_commitments_after', st.expected_commitments_after,
      'checkpoint_met',     checkpoint_met,
      'ledger_rows_after',  ledger_rows,
      'commitments_after',  observed_commitments,
      'applied_cents_after', observed_cents));
  end loop;

  -- Recomputed after the loop rather than reusing the last step's reading, so
  -- the verdict cannot depend on where the loop happened to stop.
  select count(*) into observed_commitments
    from synthetic.payment_commitments c where c.invoice_number = s.target_invoice;
  select coalesce(sum(c.amount_cents), 0) into observed_cents
    from synthetic.payment_commitments c where c.invoice_number = s.target_invoice;

  met := observed_commitments = s.expected_commitments
     and observed_cents = s.expected_applied_cents
     and checkpoints_held;

  return jsonb_build_object(
    'sequence_id',            s.id,
    'scenario_id',            s.scenario_id,
    'ordinal',                s.ordinal,
    'title',                  s.title,
    'intent',                 s.intent,
    'consequence',            s.consequence,
    'target_invoice',         s.target_invoice,
    'expectation',            s.expectation,
    'expectation_text',       s.expectation_text,
    'expected_commitments',   s.expected_commitments,
    'expected_applied_cents', s.expected_applied_cents,
    'observed_commitments',   observed_commitments,
    'observed_applied_cents', observed_cents,
    'expectation_met',        met,
    'checkpoints_held',       checkpoints_held,
    'configuration',          to_jsonb(cfg) - 'id',
    'steps',                  steps,
    'ledger', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'ledger_key',        p.ledger_key,
               'key_kind',          p.key_kind,
               'event_id',          p.event_id,
               'first_delivery_id', p.first_delivery_id,
               'outcome',           p.outcome
             ) order by p.ledger_key), '[]'::jsonb)
      from synthetic.processed_events p),
    'commitments', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id',             c.id,
               'invoice_number', c.invoice_number,
               'event_id',       c.event_id,
               'delivery_id',    c.delivery_id,
               'attempt',        c.attempt,
               'amount_cents',   c.amount_cents
             ) order by c.id), '[]'::jsonb)
      from synthetic.payment_commitments c));
end;
$$;

revoke all on function synthetic.run_documented_sequence(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Configuration snapshot, so the buyer-facing "what changed" is read from the
-- database rather than written by hand — the same rule the S2 policy excerpt
-- follows.
-- ---------------------------------------------------------------------

create or replace function synthetic.replay_configuration_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'configuration', (select to_jsonb(c) - 'id' from synthetic.replay_configuration c where c.id),
    'ledger_constraint', (
      select pg_catalog.pg_get_constraintdef(con.oid)
      from pg_catalog.pg_constraint con
      join pg_catalog.pg_class cl on cl.oid = con.conrelid
      join pg_catalog.pg_namespace n on n.oid = cl.relnamespace
      where n.nspname = 'synthetic' and cl.relname = 'processed_events'
        and con.contype = 'p'),
    'signature_algorithm', 'HMAC-SHA256 over a canonical payload string built from the delivery fields; a real integration signs the provider''s documented string, normally the raw request body and a timestamp header'
  );
$$;

revoke all on function synthetic.replay_configuration_snapshot() from public, anon, authenticated;
