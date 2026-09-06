-- =====================================================================
-- The two documented policy modes: vulnerable and remediated.
--
-- Trace: MPS-REQ-003 (representative unauthorized/cross-tenant failure),
--        MPS-REQ-004 (the authorization boundary plus a reproducible negative
--        test), MPS-REQ-005 (storage/configuration boundary),
--        MPS-ACC-003/004/006, MPS-RULE-002 (states stay distinct).
--
-- Both modes are applied by name only. There is no free-form policy input and
-- no third mode. Switching modes is an offline harness operation; the deployed
-- public application has no database connection and cannot call either one.
--
-- The vulnerable mode reproduces four misconfigurations that are common in
-- real Supabase launches. They are reproduced here on invented data inside an
-- isolated schema so the failure can be shown truthfully.
-- =====================================================================

create or replace function synthetic.drop_all_fixture_policies()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  drop policy if exists profiles_select        on synthetic.profiles;
  drop policy if exists profiles_update        on synthetic.profiles;
  drop policy if exists profiles_delete        on synthetic.profiles;
  drop policy if exists org_members_select     on synthetic.org_members;
  drop policy if exists org_members_insert     on synthetic.org_members;
  drop policy if exists org_members_update     on synthetic.org_members;
  drop policy if exists org_members_delete     on synthetic.org_members;
  drop policy if exists invoices_select        on synthetic.invoices;
  drop policy if exists storage_objects_select on synthetic.storage_objects;
  drop policy if exists storage_objects_insert on synthetic.storage_objects;
  drop policy if exists storage_objects_update on synthetic.storage_objects;
  drop policy if exists storage_objects_delete on synthetic.storage_objects;
end;
$$;

-- ---------------------------------------------------------------------
-- Vulnerable mode
-- ---------------------------------------------------------------------

create or replace function synthetic.apply_vulnerable_mode()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform synthetic.drop_all_fixture_policies();

  -- Finding 1 — tenant-blind policy. `using (true)` is the single most common
  -- Supabase RLS mistake: RLS is switched on, so the project looks protected,
  -- but the predicate constrains nothing.
  alter table synthetic.profiles enable row level security;
  create policy profiles_select on synthetic.profiles for select to authenticated using (true);
  create policy profiles_update on synthetic.profiles for update to authenticated using (true);
  create policy profiles_delete on synthetic.profiles for delete to authenticated using (true);

  -- Finding 2 — read path scoped, write path widened. USING correctly limits
  -- which rows the member may update, but WITH CHECK was set to true, so
  -- nothing constrains the row that is actually written and the member can
  -- move their own record into another tenant.
  --
  -- Two notes for reviewers, both established by running this fixture rather
  -- than by reading the documentation:
  --
  --  1. Omitting WITH CHECK entirely would NOT reproduce this. PostgreSQL
  --     reuses the USING expression as the check when WITH CHECK is absent.
  --     The check has to be explicitly widened, which is what tends to happen
  --     when a failing update policy is "fixed" by loosening it.
  --
  --  2. A widened check is still not enough on its own. When a SELECT policy
  --     exists, PostgreSQL also tests the new row against that policy for any
  --     UPDATE that reads (which includes any UPDATE with a WHERE clause), so
  --     a tenant-scoped SELECT policy blocks the escalation even when the
  --     write check says true. The escalation needs the read policy to be
  --     permissive too — which is the usual real-world shape, because a
  --     project that reached for `using (true)` on one table has normally
  --     reached for it on the neighbouring tables as well.
  alter table synthetic.org_members enable row level security;
  create policy org_members_select on synthetic.org_members for select to authenticated
    using (true);
  create policy org_members_insert on synthetic.org_members for insert to authenticated
    with check (true);
  create policy org_members_update on synthetic.org_members for update to authenticated
    using (tenant_id = synthetic.current_tenant_id())
    with check (true);
  create policy org_members_delete on synthetic.org_members for delete to authenticated
    using (tenant_id = synthetic.current_tenant_id());

  -- Finding 3 — configuration boundary. The table is exposed by a grant but
  -- row level security was never enabled, so no policy is consulted at all.
  alter table synthetic.invoices disable row level security;

  -- Finding 4 — storage boundary. A public-read policy on an object table that
  -- also holds private tenant files, plus a write grant to the anonymous role.
  alter table synthetic.storage_objects enable row level security;
  create policy storage_objects_select on synthetic.storage_objects for select to anon, authenticated using (true);
  create policy storage_objects_insert on synthetic.storage_objects for insert to anon, authenticated with check (true);
  create policy storage_objects_update on synthetic.storage_objects for update to authenticated using (true);
  create policy storage_objects_delete on synthetic.storage_objects for delete to authenticated using (true);
  grant insert on synthetic.storage_objects to anon;
end;
$$;

-- ---------------------------------------------------------------------
-- Remediated mode
-- ---------------------------------------------------------------------

create or replace function synthetic.apply_remediated_mode()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform synthetic.drop_all_fixture_policies();

  -- Fix 1 — every predicate is tenant-scoped, and every write path carries
  -- WITH CHECK as well as USING.
  alter table synthetic.profiles enable row level security;
  create policy profiles_select on synthetic.profiles for select to authenticated
    using (tenant_id = synthetic.current_tenant_id());
  create policy profiles_update on synthetic.profiles for update to authenticated
    using (tenant_id = synthetic.current_tenant_id())
    with check (tenant_id = synthetic.current_tenant_id());
  create policy profiles_delete on synthetic.profiles for delete to authenticated
    using (tenant_id = synthetic.current_tenant_id());

  -- Fix 2 — the update path gains the WITH CHECK it was missing.
  alter table synthetic.org_members enable row level security;
  create policy org_members_select on synthetic.org_members for select to authenticated
    using (tenant_id = synthetic.current_tenant_id());
  create policy org_members_insert on synthetic.org_members for insert to authenticated
    with check (tenant_id = synthetic.current_tenant_id());
  create policy org_members_update on synthetic.org_members for update to authenticated
    using (tenant_id = synthetic.current_tenant_id())
    with check (tenant_id = synthetic.current_tenant_id());
  create policy org_members_delete on synthetic.org_members for delete to authenticated
    using (tenant_id = synthetic.current_tenant_id());

  -- Fix 3 — row level security is enabled and a tenant-scoped policy is added.
  alter table synthetic.invoices enable row level security;
  create policy invoices_select on synthetic.invoices for select to authenticated
    using (tenant_id = synthetic.current_tenant_id());

  -- Fix 4 — visibility is honoured, private objects stay tenant-scoped, and
  -- the anonymous write grant is withdrawn.
  alter table synthetic.storage_objects enable row level security;
  create policy storage_objects_select on synthetic.storage_objects for select to anon, authenticated
    using (visibility = 'public' or tenant_id = synthetic.current_tenant_id());
  create policy storage_objects_insert on synthetic.storage_objects for insert to authenticated
    with check (tenant_id = synthetic.current_tenant_id());
  create policy storage_objects_update on synthetic.storage_objects for update to authenticated
    using (tenant_id = synthetic.current_tenant_id())
    with check (tenant_id = synthetic.current_tenant_id());
  create policy storage_objects_delete on synthetic.storage_objects for delete to authenticated
    using (tenant_id = synthetic.current_tenant_id());
  revoke insert on synthetic.storage_objects from anon;
end;
$$;

-- ---------------------------------------------------------------------
-- Mode switch — an allowlist of exactly two names.
-- ---------------------------------------------------------------------

create or replace function synthetic.apply_mode(mode text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if mode = 'vulnerable' then
    perform synthetic.apply_vulnerable_mode();
  elsif mode = 'remediated' then
    perform synthetic.apply_remediated_mode();
  else
    raise exception 'unknown policy mode %; only vulnerable and remediated exist', mode
      using errcode = 'invalid_parameter_value';
  end if;

  perform synthetic.reset_fixture();
end;
$$;

revoke all on function synthetic.apply_mode(text)             from public, anon, authenticated;
revoke all on function synthetic.apply_vulnerable_mode()      from public, anon, authenticated;
revoke all on function synthetic.apply_remediated_mode()      from public, anon, authenticated;
revoke all on function synthetic.drop_all_fixture_policies()  from public, anon, authenticated;

select synthetic.apply_mode('remediated');
