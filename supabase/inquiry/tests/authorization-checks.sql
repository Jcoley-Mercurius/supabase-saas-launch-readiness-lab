-- =====================================================================
-- Inquiry authorization checks — the deny and allow paths.
--
-- Trace: MPS-REQ-013, MPS-ACC-015; MTS SECURITY-ARCHITECTURE ("enforce RLS
--        and grants for every exposed table; test allow and deny paths"),
--        MTS-OBS-044.
--
-- SPLIT OUT OF inquiry-checks.sql ON PURPOSE, and free of psql meta-commands,
-- so the same assertions can run in BOTH places:
--
--   * `pnpm inquiries:check`        psql, against a local database
--   * `pnpm inquiries:check:hosted` the Supabase Management API, against the
--                                   real project, with no database password
--
-- That second runner exists because a privilege can be correct locally and
-- wrong hosted. A hosted Supabase project ships default privileges that grant
-- EXECUTE on new functions to anon and authenticated; the local container does
-- not. The first version of this schema revoked from PUBLIC only, which left
-- the retention and manual-deletion functions callable by any visitor holding
-- the publishable key — correct locally, a public wipe of inquiry content
-- hosted (MTS-OBS-044). These assertions were right; nothing ran them where
-- they mattered.
--
-- Every check raises on failure, so a broken boundary is an error in either
-- runner rather than a silent pass.
-- =====================================================================

do $$
declare r text; t text; priv text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    foreach t in array array['public.inquiries', 'public.inquiry_delivery_events'] loop
      foreach priv in array array['select', 'insert', 'update', 'delete', 'truncate', 'references'] loop
        if has_table_privilege(r, t, priv) then
          raise exception 'FAIL: role % holds % on %', r, priv, t;
        end if;
      end loop;
    end loop;
  end loop;
  raise notice 'PASS: anon and authenticated hold no privilege on any inquiry table';
end $$;

do $$
declare unprotected integer; policies integer;
begin
  select count(*) into unprotected
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('inquiries', 'inquiry_delivery_events')
     and c.relrowsecurity is false;
  if unprotected <> 0 then
    raise exception 'FAIL: % inquiry table(s) do not have row level security enabled', unprotected;
  end if;

  select count(*) into policies
    from pg_policies
   where schemaname = 'public'
     and tablename in ('inquiries', 'inquiry_delivery_events');
  if policies <> 0 then
    raise exception 'FAIL: % policy/policies exist on the inquiry tables; the approved model exposes no rows at all', policies;
  end if;
  raise notice 'PASS: RLS is on and no policy grants a row to anyone';
end $$;

do $$
declare r text; fn text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    foreach fn in array array[
      'public.redact_inquiry(uuid)',
      'public.redact_expired_inquiries(timestamptz)'
    ] loop
      if has_function_privilege(r, fn, 'execute') then
        raise exception 'FAIL: role % can execute %', r, fn;
      end if;
    end loop;
  end loop;
  raise notice 'PASS: retention and manual deletion are operator-only';
end $$;

do $$
begin
  if not has_function_privilege('anon',
    'public.submit_inquiry(text,text,text,text,text,text,text,text[],text,text,text)', 'execute') then
    raise exception 'FAIL: the application role cannot submit an inquiry';
  end if;
  if not has_function_privilege('anon',
    'public.record_inquiry_delivery(uuid,text,text)', 'execute') then
    raise exception 'FAIL: the application role cannot record a delivery result';
  end if;
  raise notice 'PASS: the application role reaches the two submission functions and nothing else';
end $$;

do $$
declare crossings integer;
begin
  select count(*) into crossings
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('submit_inquiry', 'record_inquiry_delivery',
                       'redact_inquiry', 'redact_expired_inquiries')
     and p.prosrc ilike '%synthetic.%';
  if crossings <> 0 then
    raise exception 'FAIL: % inquiry function(s) reference the synthetic fixture', crossings;
  end if;
  raise notice 'PASS: no inquiry function reaches into the synthetic schema';
end $$;
