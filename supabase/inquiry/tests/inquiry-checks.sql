-- =====================================================================
-- Inquiry store checks — authorization, deduplication, abuse control,
-- delivery metadata, and retention.
--
-- Trace: MPS-REQ-010/011/012/015, MPS-RULE-005/006/008,
--        MPS-ACC-011/012/016; MTS SECURITY-ARCHITECTURE
--        ("enforce RLS and grants for every exposed table; test allow and
--        deny paths", "keep production inquiry data separate from synthetic
--        fixtures and reset commands").
--
-- Every check raises on failure, so psql -v ON_ERROR_STOP=1 turns a broken
-- boundary into a non-zero exit rather than a silent pass. Run with
-- `pnpm inquiries:check`.
-- =====================================================================

\echo '— authorization: deny and allow paths (shared with the hosted runner)'
\i supabase/inquiry/tests/authorization-checks.sql

\echo '— measurement: separation, deny paths, and taxonomy (shared with the hosted runner)'
\i supabase/inquiry/tests/measurement-checks.sql

\echo '— accept: a first submission persists once and returns a reference'
begin;
do $$
declare result jsonb; rows integer;
begin
  result := public.submit_inquiry(
    'digest-alpha', 'Test Person', 'person@example.test', 'Example Co',
    'Founder / CTO', 'Next.js on Vercel with Supabase', 'pre-launch',
    array['authorization-and-rls'], 'Review our RLS policies before launch.',
    'authorized-by-me', 'local'
  );

  if result->>'outcome' <> 'accepted' then
    raise exception 'FAIL: a first submission returned % instead of accepted', result->>'outcome';
  end if;
  if (result->>'reference') is null then
    raise exception 'FAIL: an accepted submission returned no reference';
  end if;
  if result ? 'contact_email' or result::text ilike '%person@example.test%' then
    raise exception 'FAIL: the submission result echoed inquiry content back to the caller';
  end if;

  select count(*) into rows from public.inquiries where dedupe_key = 'digest-alpha';
  if rows <> 1 then
    raise exception 'FAIL: expected exactly one stored row, got %', rows;
  end if;
  raise notice 'PASS: a first submission persists exactly one row and returns only an outcome and a reference';
end $$;
rollback;

\echo '— duplicate: a repeat submission creates no second row and returns the original'
begin;
do $$
declare first_result jsonb; second_result jsonb; rows integer; before_activity timestamptz; after_activity timestamptz;
begin
  first_result := public.submit_inquiry(
    'digest-beta', 'Test Person', 'person@example.test', null,
    'Engineering lead', 'Supabase + Remix', 'investor-diligence',
    array['webhook-integrity'], 'Duplicate handling check.',
    'client-authorization-required', 'local'
  );
  select last_activity_at into before_activity
    from public.inquiries where id = (first_result->>'reference')::uuid;

  perform pg_sleep(0.01);

  second_result := public.submit_inquiry(
    'digest-beta', 'Test Person', 'person@example.test', null,
    'Engineering lead', 'Supabase + Remix', 'investor-diligence',
    array['webhook-integrity'], 'Duplicate handling check, sent twice.',
    'client-authorization-required', 'local'
  );

  if second_result->>'outcome' <> 'duplicate' then
    raise exception 'FAIL: a repeat submission returned % instead of duplicate', second_result->>'outcome';
  end if;
  if second_result->>'reference' <> first_result->>'reference' then
    raise exception 'FAIL: the duplicate did not link back to the original acknowledgement';
  end if;
  if (second_result->>'submission_count')::int <> 2 then
    raise exception 'FAIL: the duplicate did not increment the consolidation count';
  end if;

  select count(*) into rows from public.inquiries where dedupe_key = 'digest-beta';
  if rows <> 1 then
    raise exception 'FAIL: a duplicate created % rows; MPS-RULE-006 forbids implying a second engagement', rows;
  end if;

  -- The original content stands; the second submission does not overwrite it.
  if (select review_request from public.inquiries where dedupe_key = 'digest-beta')
     <> 'Duplicate handling check.' then
    raise exception 'FAIL: the duplicate overwrote the original inquiry content';
  end if;

  select last_activity_at into after_activity
    from public.inquiries where id = (first_result->>'reference')::uuid;
  if after_activity <= before_activity then
    raise exception 'FAIL: a repeat submission did not advance the retention clock';
  end if;
  raise notice 'PASS: a duplicate advances the original and creates no second record';
end $$;
rollback;

\echo '— abuse control: one sender is bounded, and no row is written when it trips'
begin;
do $$
declare result jsonb; rows_before integer; rows_after integer; i integer;
begin
  -- Ten submissions from one sender collapse into one row with count 10.
  for i in 1..10 loop
    perform public.submit_inquiry(
      'digest-gamma', 'Test Person', 'person@example.test', null,
      'Founder', 'Supabase', 'pre-launch', array['reliability-and-recovery'],
      'Rate limit check.', 'not-yet-determined', 'local'
    );
  end loop;

  select count(*) into rows_before from public.inquiries;
  result := public.submit_inquiry(
    'digest-gamma', 'Test Person', 'person@example.test', null,
    'Founder', 'Supabase', 'pre-launch', array['reliability-and-recovery'],
    'Rate limit check, eleventh.', 'not-yet-determined', 'local'
  );
  select count(*) into rows_after from public.inquiries;

  if result->>'outcome' <> 'rate_limited' then
    raise exception 'FAIL: the eleventh submission from one sender returned %', result->>'outcome';
  end if;
  if result ? 'reference' then
    raise exception 'FAIL: a rate-limited submission returned a reference, which reads as an acknowledgement';
  end if;
  if rows_after <> rows_before then
    raise exception 'FAIL: a rate-limited submission still wrote to the store';
  end if;
  raise notice 'PASS: abuse control trips before persistence and acknowledges nothing';
end $$;
rollback;

\echo '— delivery: a result is recorded once, carries no content, and cannot be replayed'
begin;
do $$
declare result jsonb; ref uuid; first_write boolean; second_write boolean; events integer; status text;
begin
  result := public.submit_inquiry(
    'digest-delta', 'Test Person', 'person@example.test', null,
    'Founder', 'Supabase', 'pre-launch', array['storage-and-configuration'],
    'Delivery metadata check.', 'authorized-by-me', 'local'
  );
  ref := (result->>'reference')::uuid;

  first_write  := public.record_inquiry_delivery(ref, 'failed', 'transport');
  second_write := public.record_inquiry_delivery(ref, 'sent', null);

  if not first_write then
    raise exception 'FAIL: the first delivery result was not recorded';
  end if;
  if second_write then
    raise exception 'FAIL: a second delivery result overwrote the first';
  end if;

  select count(*) into events from public.inquiry_delivery_events where inquiry_id = ref;
  select delivery_status into status from public.inquiries where id = ref;
  if events <> 1 or status <> 'failed' then
    raise exception 'FAIL: expected one recorded failure, got % event(s) and status %', events, status;
  end if;
  raise notice 'PASS: a delivery result is written once and holds only a coarse failure class';
end $$;
rollback;

\echo '— retention: content is removed at 12 months and only the dedupe key remains'
begin;
do $$
declare result jsonb; ref uuid; redacted integer; row_after public.inquiries%rowtype;
begin
  result := public.submit_inquiry(
    'digest-epsilon', 'Test Person', 'person@example.test', 'Example Co',
    'Founder', 'Supabase', 'pre-launch', array['authorization-and-rls'],
    'Retention check.', 'authorized-by-me', 'local'
  );
  ref := (result->>'reference')::uuid;

  -- Not yet due: an 11-month-old inquiry must survive untouched.
  update public.inquiries set last_activity_at = now() - interval '11 months' where id = ref;
  redacted := public.redact_expired_inquiries();
  if redacted <> 0 then
    raise exception 'FAIL: retention removed an inquiry before 12 months of inactivity';
  end if;

  -- Due.
  update public.inquiries set last_activity_at = now() - interval '12 months 1 day' where id = ref;
  redacted := public.redact_expired_inquiries();
  if redacted <> 1 then
    raise exception 'FAIL: retention did not redact an inquiry past 12 months (got %)', redacted;
  end if;

  select * into row_after from public.inquiries where id = ref;
  if row_after.contact_name is not null or row_after.contact_email is not null
     or row_after.organization is not null or row_after.buyer_role is not null
     or row_after.stack_summary is not null or row_after.launch_trigger is not null
     or row_after.review_areas is not null or row_after.review_request is not null
     or row_after.authorization_status is not null then
    raise exception 'FAIL: inquiry content survived retention processing';
  end if;
  if row_after.dedupe_key is null or row_after.redacted_at is null then
    raise exception 'FAIL: retention did not leave the bounded deduplication metadata';
  end if;

  -- Idempotent: a second pass finds nothing left to do.
  if public.redact_expired_inquiries() <> 0 then
    raise exception 'FAIL: retention is not idempotent';
  end if;
  raise notice 'PASS: content is removed at 12 months, the bounded dedupe key remains, and the pass is idempotent';
end $$;
rollback;

\echo '— retention: manual deletion removes content immediately and is not revived'
begin;
do $$
declare result jsonb; ref uuid; later jsonb;
begin
  result := public.submit_inquiry(
    'digest-zeta', 'Test Person', 'person@example.test', null,
    'Founder', 'Supabase', 'pre-launch', array['authorization-and-rls'],
    'Manual deletion check.', 'authorized-by-me', 'local'
  );
  ref := (result->>'reference')::uuid;

  if not public.redact_inquiry(ref) then
    raise exception 'FAIL: manual deletion did not apply';
  end if;
  if (select contact_email from public.inquiries where id = ref) is not null then
    raise exception 'FAIL: manual deletion left inquiry content behind';
  end if;

  -- A later submission from the same sender is a NEW inquiry, never a revival
  -- of the deleted one.
  later := public.submit_inquiry(
    'digest-zeta', 'Test Person', 'person@example.test', null,
    'Founder', 'Supabase', 'pre-launch', array['authorization-and-rls'],
    'A new inquiry after deletion.', 'authorized-by-me', 'local'
  );
  if later->>'outcome' <> 'accepted' then
    raise exception 'FAIL: a submission after manual deletion returned %', later->>'outcome';
  end if;
  if later->>'reference' = ref::text then
    raise exception 'FAIL: a submission after manual deletion revived the deleted record';
  end if;
  raise notice 'PASS: manual deletion is immediate and a later submission starts a new record';
end $$;
rollback;

\echo '— privacy: no stored inquiry value may look like a credential'
begin;
do $$
declare hits integer;
begin
  perform public.submit_inquiry(
    'digest-eta', 'Test Person', 'person@example.test', null,
    'Founder', 'Supabase', 'pre-launch', array['authorization-and-rls'],
    'A perfectly ordinary request with no secrets in it.', 'authorized-by-me', 'local'
  );

  select count(*) into hits
    from public.inquiries,
         lateral (values (contact_name), (contact_email), (organization), (buyer_role),
                         (stack_summary), (launch_trigger), (review_request),
                         (array_to_string(review_areas, ' '))) as v(value)
   where v.value ~ '(?i)(sk_live_|sk_test_|service_role|bearer\s|postgres(ql)?://|eyJ[A-Za-z0-9_-]{10,})';
  if hits <> 0 then
    raise exception 'FAIL: % stored value(s) match a credential pattern', hits;
  end if;
  raise notice 'PASS: no stored inquiry value matches a credential pattern';
end $$;
rollback;

\echo '— all inquiry checks passed'
