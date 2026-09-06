-- =====================================================================
-- The documented test set for S2.
--
-- Trace: MPS-REQ-003/004/005, MPS-ACC-003/004/005/006.
--
-- This file is the single reviewable definition of every negative and allow
-- path the lab claims to have run. A check that is not registered here is
-- reported as Untested and is never implied to have passed (MPS-ACC-005).
--
-- The SQL below is executed verbatim and is also what the buyer is shown, so
-- it must stay readable. No credential, key, token, or real address appears in
-- any statement (MPS-REQ-013, MPS-ACC-015).
-- =====================================================================

truncate table synthetic.documented_tests, synthetic.test_actors;

insert into synthetic.test_actors (key, db_role, profile_id, label, description) values
  ('harbor_member',       'authenticated', '5c1d8b22-0002-4000-8000-000000000003',
   'Priya Raghavan · member of Harbor Logistics',
   'A signed-in member of the second synthetic tenant. Every cross-tenant test is run as this actor.'),
  ('northwind_admin',     'authenticated', '9f2e1c4a-0001-4000-8000-000000000001',
   'Alex Rivera · admin of Northwind Analytics',
   'A signed-in administrator of the first synthetic tenant, used for same-tenant allow paths.'),
  ('anonymous_visitor',   'anon',          null,
   'Anonymous visitor',
   'An unauthenticated caller holding only the anonymous role, as a public Supabase API request would.'),
  ('configuration_review','postgres',      null,
   'Configuration review',
   'A read-only inspection of the database catalog. It changes nothing and asserts no identity.');

-- ---------------------------------------------------------------------
-- Scenario: authorization-and-rls
-- ---------------------------------------------------------------------

insert into synthetic.documented_tests
  (id, scenario_id, ordinal, resource, operation, actor_key, title, intent, sql_text, verify_sql, expectation, consequence) values

('RLS-001', 'authorization-and-rls', 1, 'synthetic.profiles', 'select', 'harbor_member',
 'Read another tenant''s member profiles',
 'A member of Harbor Logistics asks the API for the profile rows belonging to Northwind Analytics.',
 $q$select id, tenant_id, full_name, job_title
   from synthetic.profiles
  where tenant_id = '11111111-1111-4111-8111-111111111111'
  order by full_name$q$,
 null,
 'deny',
 'Every customer of the platform could read the names, roles, and contact records of every other customer.'),

('RLS-002', 'authorization-and-rls', 2, 'synthetic.profiles', 'select', 'harbor_member',
 'Read the member''s own tenant profiles',
 'The same member asks for the profiles that belong to their own tenant. This confirms the policy constrains the boundary without breaking the product.',
 $q$select id, tenant_id, full_name, job_title
   from synthetic.profiles
  where tenant_id = '22222222-2222-4222-8222-222222222222'
  order by full_name$q$,
 null,
 'allow',
 'If this path is blocked, the fix has broken legitimate access rather than closed the boundary.'),

('RLS-003', 'authorization-and-rls', 3, 'synthetic.profiles', 'update', 'harbor_member',
 'Modify another tenant''s member profile',
 'The member attempts to write to a Northwind profile row.',
 $q$update synthetic.profiles
      set job_title = 'Edited from another tenant'
    where tenant_id = '11111111-1111-4111-8111-111111111111'$q$,
 $q$select id, tenant_id, full_name, job_title
      from synthetic.profiles
     where tenant_id = '11111111-1111-4111-8111-111111111111'
     order by full_name$q$,
 'deny',
 'A tenant could silently alter another tenant''s records, with no audit trail on the victim''s side.'),

('RLS-004', 'authorization-and-rls', 4, 'synthetic.profiles', 'delete', 'harbor_member',
 'Delete another tenant''s member profile',
 'The member attempts to remove a Northwind profile row.',
 $q$delete from synthetic.profiles
    where tenant_id = '11111111-1111-4111-8111-111111111111'
      and full_name = 'Taylor Kim'$q$,
 $q$select id, tenant_id, full_name
      from synthetic.profiles
     where tenant_id = '11111111-1111-4111-8111-111111111111'
     order by full_name$q$,
 'deny',
 'A tenant could destroy another tenant''s data, which is a data-loss incident as well as an isolation failure.'),

('RLS-005', 'authorization-and-rls', 5, 'synthetic.org_members', 'select', 'harbor_member',
 'Enumerate another tenant''s membership',
 'The member asks which accounts belong to Northwind Analytics and what role each holds.',
 $q$select id, tenant_id, profile_id, member_role
   from synthetic.org_members
  where tenant_id = '11111111-1111-4111-8111-111111111111'
  order by member_role$q$,
 null,
 'deny',
 'Membership and role data maps a competitor''s org chart and identifies who to target for escalation.'),

('RLS-006', 'authorization-and-rls', 6, 'synthetic.org_members', 'update', 'harbor_member',
 'Move the member''s own record into another tenant',
 'The member updates a row they are allowed to read and writes a different tenant_id into it, granting themselves standing membership of another tenant. Reproducing this needs both a permissive read policy and a widened write check: PostgreSQL tests the new row against the SELECT policy as well.',
 $q$update synthetic.org_members
      set tenant_id = '11111111-1111-4111-8111-111111111111'
    where profile_id = '5c1d8b22-0002-4000-8000-000000000003'$q$,
 $q$select id, tenant_id, profile_id, member_role
      from synthetic.org_members
     where profile_id = '5c1d8b22-0002-4000-8000-000000000003'$q$,
 'deny',
 'A member could grant themselves standing membership of another tenant, turning a read boundary into a persistent account takeover.'),

('RLS-007', 'authorization-and-rls', 7, 'synthetic.invoices', 'select', 'harbor_member',
 'Read another tenant''s invoices',
 'The member asks for the billing records of Northwind Analytics.',
 $q$select id, tenant_id, number, amount_cents, status
   from synthetic.invoices
  where tenant_id = '11111111-1111-4111-8111-111111111111'
  order by number$q$,
 null,
 'deny',
 'Revenue, customer count, and commercial terms would be readable by any other customer on the platform.'),

('RLS-008', 'authorization-and-rls', 8, 'synthetic.invoices', 'select', 'harbor_member',
 'Read the member''s own tenant invoices',
 'The same member asks for their own tenant''s billing records.',
 $q$select id, tenant_id, number, amount_cents, status
   from synthetic.invoices
  where tenant_id = '22222222-2222-4222-8222-222222222222'
  order by number$q$,
 null,
 'allow',
 'If this path is blocked, billing has been broken for legitimate users.');

-- ---------------------------------------------------------------------
-- Scenario: storage-and-configuration
-- ---------------------------------------------------------------------

insert into synthetic.documented_tests
  (id, scenario_id, ordinal, resource, operation, actor_key, title, intent, sql_text, verify_sql, expectation, consequence) values

('STO-001', 'storage-and-configuration', 1, 'synthetic.storage_objects', 'select', 'anonymous_visitor',
 'Read a private tenant file as an anonymous visitor',
 'An unauthenticated caller lists the private objects in the shared tenant-documents bucket.',
 $q$select id, tenant_id, bucket_id, object_path, visibility
   from synthetic.storage_objects
  where bucket_id = 'tenant-documents'
    and visibility = 'private'
  order by object_path$q$,
 null,
 'deny',
 'Private customer documents would be retrievable by anyone holding the public API URL, with no sign-in at all.'),

('STO-002', 'storage-and-configuration', 2, 'synthetic.storage_objects', 'select', 'harbor_member',
 'Read another tenant''s private file while signed in',
 'A signed-in member of Harbor Logistics asks for Northwind''s private objects.',
 $q$select id, tenant_id, bucket_id, object_path, visibility
   from synthetic.storage_objects
  where tenant_id = '11111111-1111-4111-8111-111111111111'
    and visibility = 'private'
  order by object_path$q$,
 null,
 'deny',
 'Any paying customer could download another customer''s private files through the ordinary storage API.'),

('STO-003', 'storage-and-configuration', 3, 'synthetic.storage_objects', 'select', 'harbor_member',
 'Read the member''s own private file',
 'The same member asks for their own tenant''s private objects.',
 $q$select id, tenant_id, bucket_id, object_path, visibility
   from synthetic.storage_objects
  where tenant_id = '22222222-2222-4222-8222-222222222222'
    and visibility = 'private'
  order by object_path$q$,
 null,
 'allow',
 'If this path is blocked, tenants can no longer reach their own uploads.'),

('STO-004', 'storage-and-configuration', 4, 'synthetic.storage_objects', 'select', 'anonymous_visitor',
 'Read a deliberately public asset as an anonymous visitor',
 'An unauthenticated caller reads objects that are marked public on purpose, such as brand assets.',
 $q$select id, bucket_id, object_path, visibility
   from synthetic.storage_objects
  where visibility = 'public'
  order by object_path$q$,
 null,
 'allow',
 'If this path is blocked, the fix has over-corrected and broken public assets.'),

('STO-005', 'storage-and-configuration', 5, 'synthetic.storage_objects', 'insert', 'anonymous_visitor',
 'Write a new object as an anonymous visitor',
 'An unauthenticated caller attempts to add a row to the object table.',
 $q$insert into synthetic.storage_objects (id, tenant_id, bucket_id, object_path, visibility, byte_size)
   values ('f0000009-0009-4000-8000-000000000009',
           '11111111-1111-4111-8111-111111111111',
           'tenant-documents', 'northwind/uploaded-by-anonymous.txt', 'private', 12)$q$,
 $q$select id, tenant_id, bucket_id, object_path
      from synthetic.storage_objects
     where object_path = 'northwind/uploaded-by-anonymous.txt'$q$,
 'deny',
 'An anonymous caller could plant files inside a customer''s bucket, which is both a storage-cost and a content-trust problem.'),

('CFG-001', 'storage-and-configuration', 6, 'configuration', 'configuration', 'configuration_review',
 'Find exposed tables with row level security switched off',
 'A catalog inspection listing every fixture table that is reachable through a role grant but has no row level security enabled. An empty result is the expected state.',
 $q$select 'synthetic.' || c.relname as relation,
          c.relrowsecurity          as row_security_enabled
     from pg_catalog.pg_class c
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'synthetic'
      and c.relkind = 'r'
      and c.relname in ('profiles', 'org_members', 'invoices', 'storage_objects')
      and not c.relrowsecurity
    order by 1$q$,
 null,
 'deny',
 'A table exposed by a grant with row level security switched off consults no policy at all, so the project looks protected in the dashboard while returning every row.'),

('CFG-002', 'storage-and-configuration', 7, 'configuration', 'configuration', 'configuration_review',
 'Find write privileges held by the anonymous role',
 'A catalog inspection listing every insert, update, or delete privilege granted to the anonymous role. An empty result is the expected state.',
 $q$select g.table_schema || '.' || g.table_name as relation,
          g.grantee,
          lower(g.privilege_type)               as privilege
     from information_schema.role_table_grants g
    where g.table_schema = 'synthetic'
      and g.grantee = 'anon'
      and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
    order by 1, 3$q$,
 null,
 'deny',
 'A write privilege on the anonymous role lets an unauthenticated caller change stored data regardless of how carefully the read policies were written.'),

('CFG-003', 'storage-and-configuration', 8, 'configuration', 'configuration', 'configuration_review',
 'Find policies whose predicate is unconditional',
 'A catalog inspection listing every policy on a fixture table whose USING or WITH CHECK expression is the literal true. Such a policy satisfies the row level security requirement without constraining anything. An empty result is the expected state.',
 $q$select 'synthetic.' || c.relname as relation,
          p.polname                 as policy_name,
          case when pg_catalog.pg_get_expr(p.polqual, p.polrelid) = 'true'
               then 'using' else 'with check' end as unconditional_clause
     from pg_catalog.pg_policy p
     join pg_catalog.pg_class c on c.oid = p.polrelid
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'synthetic'
      and c.relname in ('profiles', 'org_members', 'invoices', 'storage_objects')
      and (pg_catalog.pg_get_expr(p.polqual, p.polrelid) = 'true'
        or pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) = 'true')
    order by 1, 2$q$,
 null,
 'deny',
 'A policy that reads using (true) makes the dashboard report row level security as enabled while every row remains readable. It is the failure that most often survives a launch review.');
