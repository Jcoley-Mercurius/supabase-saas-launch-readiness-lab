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
