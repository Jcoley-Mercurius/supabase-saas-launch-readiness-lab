-- =====================================================================
-- Bounded abuse control for the measurement write path.
--
-- Trace: MTS-CAP-008, MTS-DEC-016; MTS SECURITY-ARCHITECTURE ("apply rate
--        limiting or abuse controls BEFORE persistence"); MTS-OBS-037 (abuse
--        control is bounded counters, deliberately NOT address-based).
--
-- WHY THIS EXISTS.
--
-- 20260909000003 created the measurement store while nothing could reach it.
-- S6 adds /api/measurement, which is a PUBLIC WRITE ENDPOINT — the first this
-- product has other than the inquiry route. An endpoint that inserts a row per
-- request, with no bound, is a way to grow a table until it costs money and to
-- inflate a metric until it means nothing.
--
-- The control is the one MTS-OBS-037 already established for inquiries: a
-- bounded counter evaluated INSIDE the write path, before any row is written,
-- and deliberately not address-based. An IP is personal data this product has
-- no approved basis to hold, and holding one for analytics would contradict
-- the whole design of this schema.
--
-- WHAT IT COSTS, STATED PLAINLY.
--
-- The counter is global rather than per-sender, because there is no sender to
-- count by. So a flood does not merely fail itself — it exhausts the window
-- and legitimate events are dropped alongside it. That is accepted: a
-- measurement gap is a weaker metric, while an unbounded public insert is an
-- operational and financial problem. Measurement is best-effort by
-- construction and never changes what a visitor sees, so dropping is always
-- the safe direction.
--
-- The cap is deliberately far above real traffic for a portfolio site. It is a
-- ceiling against abuse, not a throttle against use.
-- =====================================================================

create or replace function measurement.record_event(
  p_event_name    text,
  p_surface       text,
  p_scenario_slug text,
  p_environment   text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Events accepted per rolling minute, across all senders.
  cap constant integer := 600;
  recent integer;
begin
  select count(*) into recent
    from measurement.events
   where occurred_at > now() - interval '1 minute';

  -- Silently bounded. The caller is told nothing, because the endpoint returns
  -- the same answer either way: measurement must never let a visitor infer
  -- anything about the system's state from whether their event was counted.
  if recent >= cap then
    return;
  end if;

  insert into measurement.events (event_name, surface, scenario_slug, environment)
  values (p_event_name, p_surface, nullif(p_scenario_slug, ''), p_environment);
end;
$$;

comment on function measurement.record_event(text, text, text, text) is
  'The only reachable measurement surface. Write-only, and bounded to 600 events per rolling minute across all senders before any row is written.';

-- `create or replace function` preserves existing privileges, but this schema
-- exists because assumptions about privileges are what produced MTS-OBS-044.
-- Re-stating them costs nothing and cannot be wrong.
revoke all on function measurement.record_event(text, text, text, text)
  from public, anon, authenticated;
grant execute on function measurement.record_event(text, text, text, text) to anon;
