-- =====================================================================
-- Fixture safety checks.
--
-- Trace: MPS-RULE-001, MPS-REQ-013, MPS-ACC-015; MTS SECURITY-ARCHITECTURE
--        ("Keep production inquiry data separate from synthetic fixtures and
--        reset commands", "Enforce RLS and grants for every exposed table;
--        test allow/deny paths").
--
-- Every check raises on failure, so psql -v ON_ERROR_STOP=1 turns a broken
-- boundary into a non-zero exit rather than a silent pass.
-- =====================================================================

\echo '— safety: reset cannot reach data outside the synthetic schema'
begin;

-- Stand in for the public.inquiries table S5 will add. If reset can reach
-- across the schema boundary, this row disappears.
create table public.unrelated_probe (id int primary key, note text);
insert into public.unrelated_probe values (1, 'must survive a fixture reset');

-- Dirty the fixture first so the reset has real work to do.
delete from synthetic.invoices;
update synthetic.profiles set job_title = 'dirty';

select synthetic.reset_fixture();

do $$
declare probe_rows integer; invoice_rows integer; dirty_rows integer;
begin
  select count(*) into probe_rows   from public.unrelated_probe;
  select count(*) into invoice_rows from synthetic.invoices;
  select count(*) into dirty_rows   from synthetic.profiles where job_title = 'dirty';

  if probe_rows <> 1 then
    raise exception 'FAIL: synthetic.reset_fixture() deleted data outside the synthetic schema';
  end if;
  if invoice_rows <> 4 then
    raise exception 'FAIL: reset did not reseed invoices (got %)', invoice_rows;
  end if;
  if dirty_rows <> 0 then
    raise exception 'FAIL: reset did not clear modified fixture rows';
  end if;
  raise notice 'PASS: reset restored the fixture and left public.unrelated_probe intact';
end $$;

drop table public.unrelated_probe;
rollback;

\echo '— safety: reset is repeatable and byte-identical'
do $$
declare first_digest text; second_digest text;
begin
  perform synthetic.reset_fixture();
  select md5(string_agg(t::text, '|' order by t::text)) into first_digest
    from (select * from synthetic.profiles) t;

  perform synthetic.reset_fixture();
  select md5(string_agg(t::text, '|' order by t::text)) into second_digest
    from (select * from synthetic.profiles) t;

  if first_digest is distinct from second_digest then
    raise exception 'FAIL: reset is not deterministic (% vs %)', first_digest, second_digest;
  end if;
  raise notice 'PASS: two resets produced identical fixture rows (md5 %)', first_digest;
end $$;

\echo '— safety: application roles cannot reach any privileged fixture function'
do $$
declare
  fn   text;
  role text;
  fns  text[] := array[
    'synthetic.apply_mode(text)',
    'synthetic.apply_vulnerable_mode()',
    'synthetic.apply_remediated_mode()',
    'synthetic.reset_fixture()',
    'synthetic.seed_fixture()',
    'synthetic.drop_all_fixture_policies()',
    'synthetic.run_documented_test(text)',
    'synthetic.privilege_snapshot()'
  ];
begin
  foreach fn in array fns loop
    foreach role in array array['anon', 'authenticated'] loop
      if has_function_privilege(role, fn, 'execute') then
        raise exception 'FAIL: role % can execute %', role, fn;
      end if;
    end loop;
  end loop;
  raise notice 'PASS: anon and authenticated hold no execute privilege on any privileged fixture function';
end $$;

\echo '— safety: application roles cannot read the documented-test registry'
do $$
declare role text;
begin
  foreach role in array array['anon', 'authenticated'] loop
    if has_table_privilege(role, 'synthetic.documented_tests', 'select')
       or has_table_privilege(role, 'synthetic.test_actors', 'select') then
      raise exception 'FAIL: role % can read the documented-test registry', role;
    end if;
  end loop;
  raise notice 'PASS: the documented-test registry is not readable by an application role';
end $$;

\echo '— safety: only the two approved policy modes are accepted'
do $$
begin
  begin
    perform synthetic.apply_mode('drop everything');
    raise exception 'FAIL: apply_mode accepted an unapproved mode name';
  exception
    when invalid_parameter_value then
      raise notice 'PASS: apply_mode rejected an unapproved mode name';
  end;
end $$;

\echo '— safety: the fixture holds no credential-shaped value'
do $$
declare hits integer;
begin
  select count(*) into hits from (
    select work_email as v from synthetic.profiles
    union all select full_name from synthetic.profiles
    union all select object_path from synthetic.storage_objects
    union all select number from synthetic.invoices
  ) v
  where v.v ~* '(password|secret|api[-_ ]?key|bearer|service[-_ ]?role)'
     or v.v ~ 'eyJ[A-Za-z0-9_-]{10,}'
     or v.v ~ 'sb[ps]_[A-Za-z0-9]{8,}';

  if hits > 0 then
    raise exception 'FAIL: % fixture value(s) look like a credential', hits;
  end if;
  raise notice 'PASS: no fixture value matches a credential pattern';
end $$;

-- Leave the fixture in the remediated state.
select synthetic.apply_mode('remediated');

-- =====================================================================
-- S3 replay fixture (MPS-REQ-006/007, MPS-RULE-001, MPS-ACC-015).
-- =====================================================================

\echo '— safety: the replay reset cannot reach the S2 fixture or the public schema'
begin;

create table public.unrelated_probe (id int primary key, note text);
insert into public.unrelated_probe values (1, 'must survive a replay reset');

-- Dirty both fixtures so the reset has real work to do, and so a reset that
-- reached too far would be visible.
update synthetic.profiles set job_title = 'dirty';
insert into synthetic.payment_commitments
  (id, tenant_id, invoice_number, event_id, delivery_id, attempt, amount_cents, committed_at)
values ('probe#1', '11111111-1111-4111-8111-111111111111', 'NW-2041',
        'evt_probe', 'del_probe', 1, 1, '2026-03-02T00:00:00Z');

select synthetic.reset_replay_fixture();

do $$
declare probe_rows integer; dirty_rows integer; commitment_rows integer; delivery_rows integer;
begin
  select count(*) into probe_rows      from public.unrelated_probe;
  select count(*) into dirty_rows      from synthetic.profiles where job_title = 'dirty';
  select count(*) into commitment_rows from synthetic.payment_commitments;
  select count(*) into delivery_rows   from synthetic.webhook_deliveries;

  if probe_rows <> 1 then
    raise exception 'FAIL: synthetic.reset_replay_fixture() deleted data outside the synthetic schema';
  end if;
  -- The replay reset owns the replay tables only. It must NOT reseed the S2
  -- fixture, or the two slices would silently share a reset path.
  if dirty_rows = 0 then
    raise exception 'FAIL: the replay reset also reset the S2 fixture tables';
  end if;
  if commitment_rows <> 0 then
    raise exception 'FAIL: the replay reset did not clear payment commitments (got %)', commitment_rows;
  end if;
  if delivery_rows = 0 then
    raise exception 'FAIL: the replay reset did not reseed the delivery fixture';
  end if;
  raise notice 'PASS: the replay reset cleared only the replay tables and left everything else intact';
end $$;

drop table public.unrelated_probe;
rollback;

\echo '— safety: the replay reset is repeatable and byte-identical'
do $$
declare first_digest text; second_digest text;
begin
  perform synthetic.reset_replay_fixture();
  select md5(string_agg(t::text, '|' order by t::text)) into first_digest
    from (select * from synthetic.webhook_deliveries) t;

  perform synthetic.reset_replay_fixture();
  select md5(string_agg(t::text, '|' order by t::text)) into second_digest
    from (select * from synthetic.webhook_deliveries) t;

  if first_digest is distinct from second_digest then
    raise exception 'FAIL: the replay reset is not deterministic (% vs %)', first_digest, second_digest;
  end if;
  raise notice 'PASS: two replay resets produced identical deliveries (md5 %)', first_digest;
end $$;

\echo '— safety: application roles cannot reach any replay function or table'
do $$
declare
  fn   text;
  rel  text;
  role text;
  fns  text[] := array[
    'synthetic.apply_replay_mode(text)',
    'synthetic.reset_replay_fixture()',
    'synthetic.seed_replay_fixture()',
    'synthetic.handle_delivery(text, integer)',
    'synthetic.run_documented_sequence(text)',
    'synthetic.replay_configuration_snapshot()',
    'synthetic.expected_signature(text)',
    'synthetic.canonical_payload(text)'
  ];
  rels text[] := array[
    'synthetic.webhook_deliveries',
    'synthetic.webhook_signing_material',
    'synthetic.processed_events',
    'synthetic.payment_commitments',
    'synthetic.applied_sequence',
    'synthetic.delivery_attempts',
    'synthetic.replay_configuration',
    'synthetic.documented_sequences',
    'synthetic.documented_steps'
  ];
begin
  foreach role in array array['anon', 'authenticated'] loop
    foreach fn in array fns loop
      if has_function_privilege(role, fn, 'execute') then
        raise exception 'FAIL: role % can execute %', role, fn;
      end if;
    end loop;
    foreach rel in array rels loop
      -- Unlike the S2 fixture tables, which are granted on purpose so that row
      -- level security means something, nothing in the replay fixture is
      -- exposed to an application role at all.
      if has_table_privilege(role, rel, 'select')
         or has_table_privilege(role, rel, 'insert')
         or has_table_privilege(role, rel, 'update')
         or has_table_privilege(role, rel, 'delete') then
        raise exception 'FAIL: role % holds a privilege on %', role, rel;
      end if;
    end loop;
  end loop;
  raise notice 'PASS: no application role can reach any replay function or table';
end $$;

\echo '— safety: only the two approved replay modes are accepted'
do $$
begin
  begin
    perform synthetic.apply_replay_mode('accept everything');
    raise exception 'FAIL: apply_replay_mode accepted an unapproved mode name';
  exception
    when invalid_parameter_value then
      raise notice 'PASS: apply_replay_mode rejected an unapproved mode name';
  end;
end $$;

\echo '— safety: the signature check actually distinguishes a forged delivery'
do $$
declare valid_count integer; forged_count integer;
begin
  perform synthetic.reset_replay_fixture();

  select count(*) into valid_count
    from synthetic.webhook_deliveries d
   where d.signature = synthetic.expected_signature(d.delivery_id);
  select count(*) into forged_count
    from synthetic.webhook_deliveries d
   where d.signature is distinct from synthetic.expected_signature(d.delivery_id);

  -- If every delivery verified, the forged case would be proving nothing.
  if forged_count = 0 then
    raise exception 'FAIL: no delivery in the fixture fails signature verification';
  end if;
  if valid_count = 0 then
    raise exception 'FAIL: no delivery in the fixture passes signature verification';
  end if;
  raise notice 'PASS: % deliveries verify and % do not', valid_count, forged_count;
end $$;

\echo '— safety: the computed signature is HMAC-SHA256, not a weaker digest'
do $$
declare sample text; hmac_matches boolean;
begin
  perform synthetic.reset_replay_fixture();
  select synthetic.expected_signature('del_nw2041_a') into sample;

  -- 64 lowercase hex characters. An md5 stand-in would be 32 and would fail
  -- here, so a silent regression to a weaker digest cannot pass unnoticed.
  if sample !~ '^[0-9a-f]{64}$' then
    raise exception 'FAIL: expected_signature returned %, which is not a sha256-length hex digest', sample;
  end if;

  -- And it is genuinely keyed: recomputing with the signing material as a
  -- plain prefix, the shape the fixture used before, must NOT reproduce it.
  select sample = encode(extensions.hmac(
           synthetic.canonical_payload('del_nw2041_a'),
           (select m.material from synthetic.webhook_signing_material m),
           'sha256'), 'hex')
    into hmac_matches;
  if not hmac_matches then
    raise exception 'FAIL: expected_signature is not the HMAC of the canonical payload under the signing material';
  end if;

  raise notice 'PASS: signatures are keyed HMAC-SHA256 over the canonical payload';
end $$;

\echo '— safety: the replay fixture holds no credential-shaped value'
do $$
declare hits integer;
begin
  select count(*) into hits from (
    select delivery_id as v from synthetic.webhook_deliveries
    union all select event_id       from synthetic.webhook_deliveries
    union all select event_type     from synthetic.webhook_deliveries
    union all select invoice_number from synthetic.webhook_deliveries
  ) v
  where v.v ~* '(password|secret|api[-_ ]?key|bearer|service[-_ ]?role)'
     or v.v ~ 'eyJ[A-Za-z0-9_-]{10,}'
     or v.v ~ 'sb[ps]_[A-Za-z0-9]{8,}';

  if hits > 0 then
    raise exception 'FAIL: % replay fixture value(s) look like a credential', hits;
  end if;
  raise notice 'PASS: no replay fixture value matches a credential pattern';
end $$;

-- Leave both fixtures in the remediated state.
select synthetic.apply_replay_mode('remediated');

