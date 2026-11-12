-- Run this in the SQL Editor of BOTH projects (old eu-west-1 and new
-- eu-central-1) and compare the outputs. Any line that differs is drift
-- between production and supabase/migrations.

-- 1) Columns
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2) Constraints (PK / FK / UNIQUE / CHECK)
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY 1, 2;

-- 3) Functions, triggers, views (things created by hand in the dashboard show up here)
SELECT 'function' AS kind, p.proname AS name FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
UNION ALL
SELECT 'trigger', tgrelid::regclass || '.' || tgname FROM pg_trigger WHERE NOT tgisinternal AND tgrelid::regclass::text NOT LIKE 'auth.%' AND tgrelid::regclass::text NOT LIKE 'storage.%'
UNION ALL
SELECT 'view', viewname FROM pg_views WHERE schemaname = 'public'
ORDER BY 1, 2;

-- 4) RLS status + policies
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       p.policyname, p.cmd, p.roles
FROM pg_class c
LEFT JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = 'public'
WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
ORDER BY 1, 3;
