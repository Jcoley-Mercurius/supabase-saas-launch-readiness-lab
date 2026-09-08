-- =====================================================================
-- The entire reachable surface of the inquiry store: four functions.
--
-- Trace: MPS-REQ-010/011/012/015, MPS-RULE-005/006/008, MPS-ACC-011/012/016;
--        MTS SECURITY-ARCHITECTURE ("apply rate limiting or abuse controls
--        before persistence and notification", "deduplicate using a bounded
--        key; never create duplicate engagement implications").
--
-- Every function is SECURITY DEFINER with `set search_path = ''`, so it runs
-- with the owner's privileges over fully-qualified relations only and cannot be
-- redirected by a caller-controlled search path.
--
-- ORDER MATTERS. Abuse control is evaluated first, then deduplication, and only
-- then does anything persist. A rate-limited submission writes no row, and a
-- duplicate submission writes no second row — it advances the retention clock
-- on the original and hands back the ORIGINAL acknowledgement, which is how
-- MPS-RULE-006 ("must not create a duplicate engagement or misrepresent
-- demand") is satisfied in the data rather than only in the wording.
-- =====================================================================

-- ---------------------------------------------------------------------
-- submit_inquiry
--
-- Returns one of three outcomes and nothing else:
--   {"outcome":"accepted",     "reference":<uuid>, "submitted_at":<ts>, "submission_count":1}
--   {"outcome":"duplicate",    "reference":<uuid>, "submitted_at":<ts>, "submission_count":n}
--   {"outcome":"rate_limited"}
--
-- It never returns inquiry content, not even the content just submitted.
-- ---------------------------------------------------------------------

create or replace function public.submit_inquiry(
  p_dedupe_key           text,
  p_contact_name         text,
  p_contact_email        text,
  p_organization         text,
  p_buyer_role           text,
  p_stack_summary        text,
  p_launch_trigger       text,
  p_review_areas         text[],
  p_review_request       text,
  p_authorization_status text,
  p_environment          text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Abuse control. Deliberately not IP-based: an address would be personal
  -- data this product has no approved reason to store, and MPS-RULE-008 holds
  -- retained metadata to the minimum. These two bounded counters cost one
  -- index scan each and write nothing.
  c_burst_window     constant interval := interval '1 minute';
  c_burst_limit      constant integer  := 20;   -- new inquiries, all senders
  c_sender_window    constant interval := interval '1 day';
  c_sender_limit     constant integer  := 10;   -- submissions, one sender
  c_dedupe_window    constant interval := interval '30 days';

  v_existing         public.inquiries%rowtype;
  v_burst            integer;
  v_sender           integer;
  v_id               uuid;
  v_submitted_at     timestamptz;
begin
  if p_dedupe_key is null or length(p_dedupe_key) = 0 then
    raise exception 'dedupe key is required';
  end if;

  -- 1. Abuse control, before any write.
  select count(*) into v_burst
    from public.inquiries
   where submitted_at > now() - c_burst_window;

  select coalesce(sum(submission_count), 0) into v_sender
    from public.inquiries
   where dedupe_key = p_dedupe_key
     and last_activity_at > now() - c_sender_window;

  if v_burst >= c_burst_limit or v_sender >= c_sender_limit then
    return jsonb_build_object('outcome', 'rate_limited');
  end if;

  -- 2. Deduplication, before any write. A redacted row is never revived:
  --    manual deletion under MPS-REQ-015 must not resurrect deleted content.
  select * into v_existing
    from public.inquiries
   where dedupe_key = p_dedupe_key
     and redacted_at is null
     and last_activity_at > now() - c_dedupe_window
   order by last_activity_at desc
   limit 1
     for update;

  if found then
    -- A repeat submission is activity: it moves the retention clock forward
    -- (MPS-REQ-015, "12 months after latest activity") and increments the
    -- count the operator uses to consolidate. It creates no second record and
    -- overwrites none of the original content.
    -- clock_timestamp(), not now(): now() is fixed for the whole transaction,
    -- so it cannot express "latest activity" for two events in one transaction
    -- and would leave the retention clock standing still.
    update public.inquiries
       set last_activity_at = clock_timestamp(),
           submission_count = public.inquiries.submission_count + 1
     where id = v_existing.id
     returning submission_count into v_sender;

    return jsonb_build_object(
      'outcome',          'duplicate',
      'reference',        v_existing.id,
      'submitted_at',     v_existing.submitted_at,
      'submission_count', v_sender
    );
  end if;

  -- 3. Persist.
  insert into public.inquiries (
    dedupe_key, contact_name, contact_email, organization, buyer_role,
    stack_summary, launch_trigger, review_areas, review_request,
    authorization_status, environment
  ) values (
    p_dedupe_key, p_contact_name, p_contact_email, p_organization, p_buyer_role,
    p_stack_summary, p_launch_trigger, p_review_areas, p_review_request,
    p_authorization_status, p_environment
  )
  returning id, submitted_at into v_id, v_submitted_at;

  return jsonb_build_object(
    'outcome',          'accepted',
    'reference',        v_id,
    'submitted_at',     v_submitted_at,
    'submission_count', 1
  );
end;
$$;

comment on function public.submit_inquiry is
  'The only write path into the inquiry store. Rate limits, then deduplicates, then persists. Returns an outcome and a reference; never returns inquiry content.';

-- ---------------------------------------------------------------------
-- record_inquiry_delivery
--
-- Records whether the operator notification left the server. It is a bounded
-- state transition, not a general update:
--   * only from 'pending' — a delivery result is written once,
--   * only within 15 minutes of submission,
--   * only the two known outcomes and the four coarse failure classes.
--
-- The reference it needs is the internal row id, which is returned to the
-- server only and is never sent to the browser or shown to the buyer, so this
-- function has no caller-reachable identifier to be aimed at. The bounds above
-- exist because "unguessable" is a weaker control than "narrow", and the worst
-- case here is a misleading operational flag rather than data exposure.
-- ---------------------------------------------------------------------

create or replace function public.record_inquiry_delivery(
  p_reference     uuid,
  p_outcome       text,
  p_failure_class text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated uuid;
begin
  if p_outcome not in ('sent', 'failed') then
    raise exception 'unknown delivery outcome';
  end if;

  update public.inquiries
     set delivery_status = p_outcome,
         last_activity_at = clock_timestamp()
   where id = p_reference
     and delivery_status = 'pending'
     and redacted_at is null
     and submitted_at > now() - interval '15 minutes'
   returning id into v_updated;

  if v_updated is null then
    return false;
  end if;

  insert into public.inquiry_delivery_events (inquiry_id, outcome, failure_class)
  values (v_updated, p_outcome, case when p_outcome = 'failed' then coalesce(p_failure_class, 'unknown') end);

  return true;
end;
$$;

comment on function public.record_inquiry_delivery is
  'Bounded one-shot delivery-result transition. Writes a coarse failure class only: no address, payload, provider response, or secret.';

-- ---------------------------------------------------------------------
-- Retention (MPS-REQ-015, MPS-RULE-008, MPS-ACC-016)
--
-- Redaction, not deletion of the row: the row is what carries the bounded
-- deduplication key the rule permits to remain. Content columns are nulled,
-- which the table's own CHECK constraint then enforces for the row's lifetime.
--
-- Neither function is granted to a public role. Retention is an operator
-- action, run by scripts/retain-inquiries.mjs (`pnpm inquiries:retain`).
-- ---------------------------------------------------------------------

create or replace function public.redact_inquiry(p_reference uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.inquiries
     set contact_name = null, contact_email = null, organization = null,
         buyer_role = null, stack_summary = null, launch_trigger = null,
         review_areas = null, review_request = null,
         authorization_status = null,
         redacted_at = now()
   where id = p_reference
     and redacted_at is null
   returning id into v_id;

  return v_id is not null;
end;
$$;

comment on function public.redact_inquiry is
  'Earlier manual deletion path required by MPS-REQ-015. Removes all inquiry content and leaves only the bounded deduplication key and operational timestamps.';

create or replace function public.redact_expired_inquiries(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.inquiries
       set contact_name = null, contact_email = null, organization = null,
           buyer_role = null, stack_summary = null, launch_trigger = null,
           review_areas = null, review_request = null,
           authorization_status = null,
           redacted_at = p_now
     where redacted_at is null
       and last_activity_at <= p_now - interval '12 months'
     returning 1
  )
  select count(*) into v_count from expired;

  return v_count;
end;
$$;

comment on function public.redact_expired_inquiries is
  'Removes inquiry content 12 months after latest activity (MPS-REQ-015). Idempotent; returns the number of rows redacted.';

-- ---------------------------------------------------------------------
-- Grants. Two functions, one role, nothing else.
--
-- REVOKE FROM anon AND authenticated BY NAME, not only from PUBLIC.
--
-- A hosted Supabase project ships with
--   alter default privileges in schema public grant all on functions
--     to anon, authenticated, service_role;
-- so every function created here is born with a DIRECT execute grant to the
-- application roles. `revoke ... from public` does not remove a direct grant,
-- only the one held through PUBLIC. Revoking from PUBLIC alone therefore left
-- redact_inquiry and redact_expired_inquiries executable by any visitor
-- holding the publishable key - which is a public wipe of inquiry content.
--
-- The local development container carries no such default, so this was
-- invisible until the schema was applied to the hosted project and the deny
-- checks were run there. Recorded as MTS-OBS-044.
--
-- The revoke below therefore names the roles explicitly and covers all four
-- functions, and the two grants that follow are the only privileges any
-- application role holds anywhere in this schema.
-- ---------------------------------------------------------------------

revoke all on function public.submit_inquiry(
  text, text, text, text, text, text, text, text[], text, text, text
) from public, anon, authenticated;
revoke all on function public.record_inquiry_delivery(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.redact_inquiry(uuid)
  from public, anon, authenticated;
revoke all on function public.redact_expired_inquiries(timestamptz)
  from public, anon, authenticated;

grant execute on function public.submit_inquiry(
  text, text, text, text, text, text, text, text[], text, text, text
) to anon;
grant execute on function public.record_inquiry_delivery(uuid, text, text) to anon;
