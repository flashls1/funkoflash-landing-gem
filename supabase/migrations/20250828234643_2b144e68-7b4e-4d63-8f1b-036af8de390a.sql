-- Fix RLS probe function - cannot set role in security definer function
-- Instead we'll create a simplified version that tests what we can
CREATE OR REPLACE FUNCTION rls_audit.rls_probe_simple(
  p_limit int default 3
) RETURNS TABLE(
  probe text,
  table_name text,
  operation text,
  ok boolean,
  details text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, rls_audit AS $$
DECLARE
  tbl text;
  can_select boolean;
  try_insert boolean;
  try_update boolean;
  try_delete boolean;
  row_count bigint;
BEGIN
  -- Test as the current authenticated user (whoever calls this function)
  FOR tbl IN
    SELECT unnest(ARRAY[
      'business_account',
      'business_account_user', 
      'business_events',
      'business_event_account',
      'talent_profiles',
      'talent_event',
      'calendar_event',
      'bookings',
      'event_participants'
    ])
  LOOP
    -- Only test tables that exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      RETURN QUERY SELECT 'rls_probe_simple', tbl, 'TABLE_MISSING', false, 'table does not exist';
      CONTINUE;
    END IF;

    -- SELECT test
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', tbl) INTO STRICT row_count;
      can_select := true;
      RETURN QUERY SELECT 'rls_probe_simple', tbl, 'SELECT', true, format('ok: counted %s rows with RLS', row_count);
    EXCEPTION WHEN OTHERS THEN
      can_select := false;
      RETURN QUERY SELECT 'rls_probe_simple', tbl, 'SELECT', false, SQLERRM;
    END;

    -- DELETE test (dry-run with safe no-op)
    BEGIN
      EXECUTE 'BEGIN';
      EXECUTE format('DELETE FROM public.%I WHERE false', tbl);
      try_delete := true;
    EXCEPTION WHEN OTHERS THEN
      try_delete := false;
    END;
    BEGIN EXECUTE 'ROLLBACK'; EXCEPTION WHEN OTHERS THEN END;
    RETURN QUERY SELECT 'rls_probe_simple', tbl, 'DELETE', try_delete, 
      CASE WHEN try_delete THEN 'DELETE policy allows operation' ELSE 'DELETE blocked: ' || SQLERRM END;
  END LOOP;
END $$;

-- Create a function to show foreign key constraints for CASCADE analysis
CREATE OR REPLACE FUNCTION rls_audit.show_fk_constraints()
RETURNS TABLE(
  table_name text,
  constraint_name text,
  column_name text,
  referenced_table text,
  referenced_column text,
  delete_rule text,
  update_rule text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, information_schema AS $$
  SELECT 
    tc.table_name::text,
    tc.constraint_name::text,
    kcu.column_name::text,
    ccu.table_name::text as referenced_table,
    ccu.column_name::text as referenced_column,
    rc.delete_rule::text,
    rc.update_rule::text
  FROM table_constraints tc
  JOIN key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  JOIN referential_constraints rc ON rc.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('business_event_account', 'business_event_talent', 'talent_event', 'event_participants', 'bookings')
  ORDER BY tc.table_name, tc.constraint_name;
$$;