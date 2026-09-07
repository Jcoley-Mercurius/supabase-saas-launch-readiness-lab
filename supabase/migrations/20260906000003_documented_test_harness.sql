-- =====================================================================
-- Documented-test harness.
--
-- Trace: MPS-REQ-004 (a reproducible negative-test result), MPS-ACC-003/004,
--        MTS SECURITY-ARCHITECTURE "Verification evidence".
--
-- Boundary: this harness is offline developer tooling. Its functions are
-- revoked from anon and authenticated, its case registry is writable only by
-- the fixture owner, and the deployed application never opens a database
-- connection, so nothing here is reachable from a browser. The recorded
-- output of this harness — not the harness itself — is what ships.
-- =====================================================================

create table synthetic.test_actors (
  key         text primary key,
  db_role     text not null,
  -- Deliberately NOT a foreign key to synthetic.profiles. The harness registry
  -- is tooling, not fixture data, and a reference from it would force
  -- synthetic.reset_fixture() to cascade beyond the five fixture tables.
  profile_id  uuid,
  label       text not null,
  description text not null
);

create table synthetic.documented_tests (
  id          text primary key,
  scenario_id text not null,
  ordinal     integer not null,
  resource    text not null,
  operation   text not null check (operation in ('select', 'insert', 'update', 'delete', 'configuration')),
  actor_key   text not null references synthetic.test_actors (key),
  title       text not null,
  intent      text not null,
  -- The literal SQL the test runs. It is authored in supabase/tests, stored
  -- here for execution, and shown verbatim to the buyer as evidence.
  sql_text    text not null,
  -- Optional. When present, sql_text is a write executed as the actor with no
  -- RETURNING clause, and verify_sql is read back afterwards as the fixture
  -- owner to show what actually persisted.
  --
  -- Why this split matters: PostgreSQL applies the SELECT policy to the new
  -- row of any write that carries RETURNING. A cross-tenant write can then be
  -- refused by the read policy rather than by the write check, which would
  -- report the write boundary as holding when it does not. Separating the
  -- write from the read-back removes that confound.
  verify_sql  text,
  -- 'deny' expects no write, no rows, or a policy error; 'allow' expects rows.
  expectation text not null check (expectation in ('allow', 'deny')),
  consequence text not null,
  unique (scenario_id, ordinal)
);

revoke all on synthetic.test_actors, synthetic.documented_tests from anon, authenticated;

-- ---------------------------------------------------------------------
-- Runner
--
-- Executes one registered case as one registered actor and returns exactly
-- what the database did: the rows, or the SQLSTATE and message. It invents
-- nothing. Callers run each case inside its own transaction and roll back, so
-- a write case leaves no trace and every rerun starts from the same state.
-- ---------------------------------------------------------------------

-- SECURITY INVOKER on purpose. PostgreSQL forbids SET ROLE inside a
-- SECURITY DEFINER function, and the runner must be able to become `anon` and
-- `authenticated` for the row level security check to mean anything. Running
-- as the invoker is also the tighter choice: the function is revoked from
-- every application role, so only the fixture owner can call it.
create or replace function synthetic.run_documented_test(case_id text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t            synthetic.documented_tests%rowtype;
  a            synthetic.test_actors%rowtype;
  rows_json    jsonb;
  verify_json  jsonb := null;
  row_count    integer;
  outcome      text;
  err_code     text;
  err_msg      text;
  err_detail   text;
begin
  select * into t from synthetic.documented_tests where id = case_id;
  if not found then
    raise exception 'unknown documented test %', case_id using errcode = 'invalid_parameter_value';
  end if;
  select * into a from synthetic.test_actors where key = t.actor_key;

  perform set_config('synthetic.actor_id', coalesce(a.profile_id::text, ''), true);
  execute format('set local role %I', a.db_role);

  begin
    if t.verify_sql is null then
      execute format(
        'with documented_test as (%s) select coalesce(jsonb_agg(to_jsonb(documented_test)), ''[]''::jsonb) from documented_test',
        t.sql_text
      ) into rows_json;
      row_count := jsonb_array_length(rows_json);
      outcome   := case when row_count > 0 then 'rows_returned' else 'no_rows' end;
    else
      execute t.sql_text;
      get diagnostics row_count = row_count;
      rows_json := '[]'::jsonb;
      outcome   := case when row_count > 0 then 'rows_written' else 'no_rows' end;
    end if;
  exception
    when others then
      get stacked diagnostics
        err_code   = returned_sqlstate,
        err_msg    = message_text,
        err_detail = pg_exception_detail;
      rows_json := '[]'::jsonb;
      row_count := 0;
      outcome   := 'error';
  end;

  reset role;

  -- Read back as the fixture owner, so the panel shows the state the database
  -- is actually left in rather than what the write claimed.
  if t.verify_sql is not null then
    execute format(
      'with documented_test as (%s) select coalesce(jsonb_agg(to_jsonb(documented_test)), ''[]''::jsonb) from documented_test',
      t.verify_sql
    ) into verify_json;
  end if;

  return jsonb_build_object(
    'case_id',      t.id,
    'scenario_id',  t.scenario_id,
    'resource',     t.resource,
    'operation',    t.operation,
    'actor_key',    t.actor_key,
    'actor_label',  a.label,
    'db_role',      a.db_role,
    'title',        t.title,
    'intent',       t.intent,
    'consequence',  t.consequence,
    'sql_text',     t.sql_text,
    'verify_sql',   t.verify_sql,
    'expectation',  t.expectation,
    'outcome',      outcome,
    'row_count',    row_count,
    'rows',         rows_json,
    'verify_rows',  verify_json,
    'error_code',   err_code,
    'error_message', err_msg,
    'error_detail', err_detail,
    'expectation_met',
      case
        when t.expectation = 'deny'
          then outcome not in ('rows_returned', 'rows_written')
        else outcome in ('rows_returned', 'rows_written')
      end
  );
end;
$$;

revoke all on function synthetic.run_documented_test(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Grant and row-security inspection, used to classify a matrix cell as
-- "Not applicable" for a fact rather than for convenience.
-- ---------------------------------------------------------------------

create or replace function synthetic.privilege_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'relations', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'resource',      'synthetic.' || c.relname,
               'row_security',  c.relrowsecurity,
               'policies',      (
                 select coalesce(jsonb_agg(jsonb_build_object(
                          'name',      p.polname,
                          'command',   case p.polcmd when 'r' then 'select' when 'a' then 'insert'
                                                     when 'w' then 'update' when 'd' then 'delete'
                                                     else 'all' end,
                          'using',     pg_catalog.pg_get_expr(p.polqual, p.polrelid),
                          'with_check', pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)
                        ) order by p.polname), '[]'::jsonb)
                 from pg_catalog.pg_policy p where p.polrelid = c.oid
               ),
               'grants', (
                 select coalesce(jsonb_agg(distinct jsonb_build_object(
                          'grantee',   g.grantee,
                          'privilege', lower(g.privilege_type)
                        )), '[]'::jsonb)
                 from information_schema.role_table_grants g
                 where g.table_schema = 'synthetic'
                   and g.table_name = c.relname
                   and g.grantee in ('anon', 'authenticated')
               )
             ) order by c.relname), '[]'::jsonb)
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'synthetic' and c.relkind = 'r'
        and c.relname in ('profiles', 'org_members', 'invoices', 'storage_objects')
    )
  );
$$;

revoke all on function synthetic.privilege_snapshot() from public, anon, authenticated;
