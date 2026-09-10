-- =====================================================================
-- Measurement authorization and separation checks.
--
-- Trace: MTS-CAP-008, MTS-DEC-016 (first-party only), MTS-OBS-050 (the
--        separation is a property to be tested, not a convention to be
--        observed), MTS-OBS-044 (a privilege assertion proves nothing about
--        an environment it has not run in); MTS SECURITY-ARCHITECTURE
--        ("enforce RLS and grants for every exposed table; test allow and
--        deny paths").
--
-- Free of psql meta-commands, for the same reason authorization-checks.sql is:
-- these assertions must run BOTH locally and against the hosted project.
--
-- Every check raises on failure, so a broken boundary is an error rather than
-- a silent pass.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. No public role holds any privilege on the events table.
-- ---------------------------------------------------------------------
do $$
declare r text; priv text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    foreach priv in array array['select', 'insert', 'update', 'delete', 'truncate', 'references'] loop
      if has_table_privilege(r, 'measurement.events', priv) then
        raise exception 'FAIL: role % holds % on measurement.events', r, priv;
      end if;
    end loop;
  end loop;
  raise notice 'PASS: anon and authenticated hold no privilege on measurement.events';
end $$;

-- ---------------------------------------------------------------------
-- 2. RLS is on and no policy exists, so a mistaken grant still reads nothing.
-- ---------------------------------------------------------------------
do $$
declare rls_on boolean; policy_count integer;
begin
  select relrowsecurity into rls_on
    from pg_class where oid = 'measurement.events'::regclass;
  if not coalesce(rls_on, false) then
    raise exception 'FAIL: row level security is not enabled on measurement.events';
  end if;

  select count(*) into policy_count
    from pg_policies where schemaname = 'measurement' and tablename = 'events';
  if policy_count <> 0 then
    raise exception 'FAIL: measurement.events carries % policy/policies; it must carry none', policy_count;
  end if;
  raise notice 'PASS: measurement.events has RLS enabled and no policy';
end $$;

-- ---------------------------------------------------------------------
-- 3. The write function is reachable and is the ONLY reachable surface.
--
-- This is the allow path. It is asserted rather than assumed because a revoke
-- that is too broad would silently disable measurement instead of failing.
-- ---------------------------------------------------------------------
do $$
begin
  if not has_function_privilege(
    'anon', 'measurement.record_event(text, text, text, text)', 'execute'
  ) then
    raise exception 'FAIL: anon cannot execute measurement.record_event; measurement would be silently dead';
  end if;
  if not has_schema_privilege('anon', 'measurement', 'usage') then
    raise exception 'FAIL: anon lacks usage on schema measurement';
  end if;
  raise notice 'PASS: anon can execute record_event and holds schema usage';
end $$;

do $$
declare extra text;
begin
  -- Any OTHER function in the schema that anon can execute is a surface this
  -- design does not intend. Named explicitly so adding a read function later
  -- fails this check rather than quietly opening a read path.
  select string_agg(p.proname, ', ') into extra
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'measurement'
     and p.proname <> 'record_event'
     and has_function_privilege('anon', p.oid, 'execute');
  if extra is not null then
    raise exception 'FAIL: anon can execute unexpected measurement function(s): %', extra;
  end if;
  raise notice 'PASS: record_event is the only measurement function anon can execute';
end $$;

-- ---------------------------------------------------------------------
-- 4. Separation from inquiries (MTS-OBS-050).
--
-- The placement decision was that measurement may share the PROJECT but must
-- not share data. These three assertions are what "must not" means.
-- ---------------------------------------------------------------------
do $$
declare fk text;
begin
  select string_agg(conname, ', ') into fk
    from pg_constraint
   where connamespace = 'measurement'::regnamespace
     and contype = 'f';
  if fk is not null then
    raise exception 'FAIL: measurement schema carries foreign key(s): %', fk;
  end if;
  raise notice 'PASS: no foreign key leaves the measurement schema';
end $$;

do $$
declare offending text;
begin
  -- No column may be able to hold an inquiry identifier or an address. uuid
  -- would allow an inquiry id; unbounded text would allow anything at all.
  select string_agg(format('%s (%s)', column_name, data_type), ', ')
    into offending
    from information_schema.columns
   where table_schema = 'measurement'
     and table_name = 'events'
     and data_type in ('uuid', 'jsonb', 'json', 'bytea');
  if offending is not null then
    raise exception 'FAIL: measurement.events has column(s) able to carry an identifier or payload: %', offending;
  end if;
  raise notice 'PASS: measurement.events has no uuid, json, or binary column';
end $$;

do $$
declare unconstrained text;
begin
  -- Every text column must be constrained to a closed set. A free text column
  -- is where an address, a name, or a key would end up.
  select string_agg(c.column_name, ', ') into unconstrained
    from information_schema.columns c
   where c.table_schema = 'measurement'
     and c.table_name = 'events'
     and c.data_type = 'text'
     and not exists (
       select 1
         from pg_constraint con
        where con.conrelid = 'measurement.events'::regclass
          and con.contype = 'c'
          and pg_get_constraintdef(con.oid) like '%' || c.column_name || '%'
     );
  if unconstrained is not null then
    raise exception 'FAIL: measurement.events has unconstrained text column(s): %', unconstrained;
  end if;
  raise notice 'PASS: every text column on measurement.events is constrained to a closed set';
end $$;

-- ---------------------------------------------------------------------
-- 5. The taxonomy actually rejects what it claims to reject.
--
-- Assertions 1-4 describe the shape of the table. This one exercises it: a
-- constraint that is present but wrong would pass every check above.
-- ---------------------------------------------------------------------
do $$
begin
  begin
    insert into measurement.events (event_name, surface, scenario_slug, environment)
    values ('not_a_real_event', 'landing', null, 'local');
    raise exception 'FAIL: an event name outside the taxonomy was accepted';
  exception when check_violation then
    null; -- expected
  end;

  begin
    insert into measurement.events (event_name, surface, scenario_slug, environment)
    values ('scenario_viewed', 'scenario', 'not-a-real-scenario', 'local');
    raise exception 'FAIL: a scenario slug outside the approved catalogue was accepted';
  exception when check_violation then
    null; -- expected
  end;

  begin
    -- A scenario-scoped event with no scenario is not a usable measurement.
    insert into measurement.events (event_name, surface, scenario_slug, environment)
    values ('scenario_completed', 'scenario', null, 'local');
    raise exception 'FAIL: a scenario-scoped event was accepted without its scenario';
  exception when check_violation then
    null; -- expected
  end;

  begin
    insert into measurement.events (event_name, surface, scenario_slug, environment)
    values ('report_viewed', 'report', null, 'staging');
    raise exception 'FAIL: an unknown environment was accepted';
  exception when check_violation then
    null; -- expected
  end;

  raise notice 'PASS: the taxonomy rejects unknown names, slugs, scopes and environments';
end $$;

-- ---------------------------------------------------------------------
-- 6. A valid event round-trips, and leaves nothing behind.
-- ---------------------------------------------------------------------
do $$
declare before_count bigint; after_count bigint;
begin
  select count(*) into before_count from measurement.events;

  perform measurement.record_event('report_viewed', 'report', null, 'local');
  perform measurement.record_event('scenario_completed', 'scenario', 'webhook-integrity', 'local');

  select count(*) into after_count from measurement.events;
  if after_count <> before_count + 2 then
    raise exception 'FAIL: expected 2 recorded events, saw %', after_count - before_count;
  end if;

  -- Leave the table as it was found, so this file is safe to run repeatedly
  -- against a real project.
  delete from measurement.events
   where environment = 'local'
     and event_name in ('report_viewed', 'scenario_completed');

  raise notice 'PASS: record_event writes a valid event and the check cleans up after itself';
end $$;
