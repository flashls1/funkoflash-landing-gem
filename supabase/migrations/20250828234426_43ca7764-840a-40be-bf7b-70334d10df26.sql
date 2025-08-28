-- STEP 0: RLS Audit Infrastructure
-- Create audit schema and helper views

CREATE SCHEMA IF NOT EXISTS rls_audit;

-- View to show all tables and their RLS status
CREATE OR REPLACE VIEW rls_audit.v_table_rls AS
SELECT
  n.nspname as schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_size_pretty(pg_total_relation_size(c.oid)) as size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY c.relname;

-- View to show all current RLS policies
CREATE OR REPLACE VIEW rls_audit.v_policies AS
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;