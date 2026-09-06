-- =====================================================================
-- Synthetic multi-tenant SaaS fixture — schema, identity, and grants.
--
-- Trace: MPS-REQ-002 (one coherent synthetic multi-tenant SaaS context),
--        MPS-RULE-001 (synthetic data only), MPS-REQ-013 (no production
--        credential, customer record, or secret), MTS SECURITY-ARCHITECTURE
--        "Vulnerable demonstration rule" (bounded fixture, deterministic,
--        resettable).
--
-- EVERY row created here is invented. There is no real person, tenant,
-- customer, credential, key, or payment in this fixture.
--
-- Isolation boundary: the whole fixture lives in the `synthetic` schema. The
-- inquiry store that S5 adds lives in `public`. Nothing in this file, and
-- nothing in the reset path, may reference a relation outside `synthetic`.
-- =====================================================================

create schema if not exists synthetic;

comment on schema synthetic is
  'Synthetic multi-tenant SaaS audit fixture. Contains no real data. Isolated from the public inquiry store.';

-- ---------------------------------------------------------------------
-- Identity emulation
--
-- Supabase authorises with auth.uid() reading the request JWT. The fixture
-- has no auth service and issues no token, so the acting member is carried in
-- a transaction-local GUC that only the offline harness sets. This keeps the
-- policy shape identical to a real Supabase policy while removing any way for
-- a request to assert an identity.
-- ---------------------------------------------------------------------

create or replace function synthetic.current_actor_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('synthetic.actor_id', true), '')::uuid;
$$;

comment on function synthetic.current_actor_id() is
  'Stands in for auth.uid(). Reads a transaction-local GUC set only by the offline evidence harness.';

-- Reviewer note on the identity boundary.
--
-- A real Supabase policy calls auth.uid(), which reads a signed JWT the caller
-- cannot forge. This fixture has no auth service and issues no token, so the
-- acting member is carried in a GUC that any session holding a connection could
-- set. That is a deliberate simplification of IDENTITY, not of AUTHORIZATION:
-- the policies under test are ordinary PostgreSQL row level security and behave
-- exactly as they would against auth.uid().
--
-- It is safe here because nothing but the offline recorder ever connects. The
-- database runs in a local container, and the deployed application holds no
-- database client at all. This fixture must never be exposed to a public
-- network or reused as an application backend, where the GUC would let any
-- caller assert any identity.

-- ---------------------------------------------------------------------
-- Tenants, members, and protected resources
-- ---------------------------------------------------------------------

create table synthetic.tenants (
  id    uuid primary key,
  slug  text not null unique,
  name  text not null,
  plan  text not null
);

create table synthetic.profiles (
  id         uuid primary key,
  tenant_id  uuid not null references synthetic.tenants (id) on delete cascade,
  full_name  text not null,
  work_email text not null,
  job_title  text not null
);

create table synthetic.org_members (
  id         uuid primary key,
  tenant_id  uuid not null references synthetic.tenants (id) on delete cascade,
  profile_id uuid not null references synthetic.profiles (id) on delete cascade,
  member_role text not null check (member_role in ('owner', 'admin', 'member', 'viewer')),
  unique (tenant_id, profile_id)
);

create table synthetic.invoices (
  id           uuid primary key,
  tenant_id    uuid not null references synthetic.tenants (id) on delete cascade,
  number       text not null unique,
  amount_cents integer not null check (amount_cents >= 0),
  currency     text not null default 'USD',
  status       text not null check (status in ('draft', 'open', 'paid', 'void'))
);

-- Mirrors the shape of Supabase's storage.objects so the storage boundary can
-- be proven with the same RLS mechanism, without touching the real storage
-- schema or storing any file bytes.
create table synthetic.storage_objects (
  id         uuid primary key,
  tenant_id  uuid not null references synthetic.tenants (id) on delete cascade,
  bucket_id  text not null,
  object_path text not null,
  visibility text not null check (visibility in ('public', 'private')),
  byte_size  integer not null check (byte_size >= 0),
  unique (bucket_id, object_path)
);

comment on table synthetic.storage_objects is
  'Synthetic stand-in for storage.objects. Metadata only; no file content is stored.';

-- ---------------------------------------------------------------------
-- Tenant resolution
--
-- SECURITY DEFINER so the lookup does not recurse through org_members RLS.
-- It resolves only the acting member''s own tenant and accepts no argument,
-- so it cannot be used to enumerate another tenant.
-- ---------------------------------------------------------------------

create or replace function synthetic.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.tenant_id
  from synthetic.org_members m
  where m.profile_id = synthetic.current_actor_id()
  limit 1;
$$;

revoke all on function synthetic.current_tenant_id() from public;
grant execute on function synthetic.current_tenant_id() to anon, authenticated;
grant execute on function synthetic.current_actor_id() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Deterministic seed
--
-- Fixed UUIDs and fixed values: reseeding always produces byte-identical
-- rows, which is what makes the recorded evidence reproducible.
-- ---------------------------------------------------------------------

create or replace function synthetic.seed_fixture()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into synthetic.tenants (id, slug, name, plan) values
    ('11111111-1111-4111-8111-111111111111', 'northwind', 'Northwind Analytics', 'growth'),
    ('22222222-2222-4222-8222-222222222222', 'harbor',    'Harbor Logistics',    'starter');

  insert into synthetic.profiles (id, tenant_id, full_name, work_email, job_title) values
    ('9f2e1c4a-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Alex Rivera',     'alex.rivera@northwind.example',   'Head of Product'),
    ('3b7a9d0e-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Taylor Kim',      'taylor.kim@northwind.example',    'Data Engineer'),
    ('5c1d8b22-0002-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'Priya Raghavan',  'priya.raghavan@harbor.example',   'Operations Lead'),
    ('7e4f6a91-0002-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'Sam Okafor',      'sam.okafor@harbor.example',       'Finance Manager');

  insert into synthetic.org_members (id, tenant_id, profile_id, member_role) values
    ('c0000001-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '9f2e1c4a-0001-4000-8000-000000000001', 'admin'),
    ('c0000002-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '3b7a9d0e-0001-4000-8000-000000000002', 'member'),
    ('c0000003-0002-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', '5c1d8b22-0002-4000-8000-000000000003', 'member'),
    ('c0000004-0002-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', '7e4f6a91-0002-4000-8000-000000000004', 'owner');

  insert into synthetic.invoices (id, tenant_id, number, amount_cents, currency, status) values
    ('d0000001-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'NW-2041', 148000, 'USD', 'paid'),
    ('d0000002-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'NW-2042',  32500, 'USD', 'open'),
    ('d0000003-0002-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'HL-0817',  91200, 'USD', 'paid'),
    ('d0000004-0002-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'HL-0818',  15000, 'USD', 'draft');

  insert into synthetic.storage_objects (id, tenant_id, bucket_id, object_path, visibility, byte_size) values
    ('e0000001-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'tenant-documents', 'northwind/q3-revenue-model.xlsx', 'private', 184320),
    ('e0000002-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'public-assets',    'northwind/logo.svg',              'public',    4096),
    ('e0000003-0002-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'tenant-documents', 'harbor/carrier-contract.pdf',     'private', 512000),
    ('e0000004-0002-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'public-assets',    'harbor/logo.svg',                 'public',    3072);
end;
$$;

-- ---------------------------------------------------------------------
-- Safe reset
--
-- The relation list is written out literally. There is no dynamic SQL, no
-- schema argument, and no way to widen the target set, so the reset cannot
-- reach a relation outside `synthetic` — including the public inquiry store
-- that S5 will add.
-- ---------------------------------------------------------------------

create or replace function synthetic.reset_fixture()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  truncate table
    synthetic.storage_objects,
    synthetic.invoices,
    synthetic.org_members,
    synthetic.profiles,
    synthetic.tenants
  restart identity;

  perform synthetic.seed_fixture();
end;
$$;

comment on function synthetic.reset_fixture() is
  'Truncates and reseeds only the five synthetic fixture tables. Cannot reference any relation outside the synthetic schema.';

revoke all on function synthetic.reset_fixture() from public, anon, authenticated;
revoke all on function synthetic.seed_fixture() from public, anon, authenticated;

select synthetic.seed_fixture();

-- ---------------------------------------------------------------------
-- Grants
--
-- Grants are deliberately narrow and are themselves part of the evidence:
-- an operation with no grant is reported as "Not applicable" with the grant
-- state as its reason, never as a pass.
-- ---------------------------------------------------------------------

grant usage on schema synthetic to anon, authenticated;

grant select, update, delete on synthetic.profiles       to authenticated;
grant select, insert, update, delete on synthetic.org_members to authenticated;
grant select                        on synthetic.invoices to authenticated;
grant select, insert, update, delete on synthetic.storage_objects to authenticated;
grant select                        on synthetic.storage_objects to anon;

-- tenants is context, not a proof target.
grant select on synthetic.tenants to anon, authenticated;
alter table synthetic.tenants enable row level security;
create policy tenants_read_all on synthetic.tenants for select to anon, authenticated using (true);
