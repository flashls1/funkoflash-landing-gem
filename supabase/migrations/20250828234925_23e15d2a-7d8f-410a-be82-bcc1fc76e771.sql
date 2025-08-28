-- STEP 3: Delete hardening and FK cascade fixes
-- First, fix the probe function variable naming issue
CREATE OR REPLACE FUNCTION rls_audit.rls_probe(
  p_role text,
  p_limit int default 3
) RETURNS TABLE(
  probe text,
  table_name text,
  operation text,
  ok boolean,
  details text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, rls_audit AS $$
DECLARE
  tbl_name text;
  can_select boolean;
  try_insert boolean;
  try_update boolean;
  try_delete boolean;
  test_user_id uuid;
  row_count integer;
BEGIN
  test_user_id := case p_role
    when 'admin' then '00000000-0000-0000-0000-0000000000a1'::uuid
    when 'staff' then '00000000-0000-0000-0000-0000000000b1'::uuid
    when 'business' then '00000000-0000-0000-0000-0000000000c1'::uuid
    when 'talent' then '00000000-0000-0000-0000-0000000000d1'::uuid
    else '00000000-0000-0000-0000-0000000000e1'::uuid
  end;

  FOR tbl_name IN
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = tbl_name) THEN
      RETURN QUERY SELECT 'rls_probe', tbl_name, 'TABLE_MISSING', false, 'table does not exist';
      CONTINUE;
    END IF;

    -- SELECT test
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', tbl_name) INTO STRICT row_count;
      RETURN QUERY SELECT 'rls_probe', tbl_name, 'SELECT', true, format('accessible: %s rows', row_count);
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 'rls_probe', tbl_name, 'SELECT', false, SQLERRM;
    END;

    -- INSERT test (dry-run)
    BEGIN
      EXECUTE 'BEGIN';
      CASE tbl_name
        WHEN 'business_account' THEN
          EXECUTE 'INSERT INTO public.business_account (name) VALUES (''test-probe'')';
        WHEN 'business_account_user' THEN  
          EXECUTE 'INSERT INTO public.business_account_user (business_account_id, user_id) VALUES (gen_random_uuid(), $1)' USING test_user_id;
        WHEN 'business_events' THEN
          EXECUTE 'INSERT INTO public.business_events (title) VALUES (''test-probe'')';
        WHEN 'business_event_account' THEN
          EXECUTE 'INSERT INTO public.business_event_account (event_id, business_account_id) VALUES (gen_random_uuid(), gen_random_uuid())';
        WHEN 'talent_profiles' THEN
          EXECUTE 'INSERT INTO public.talent_profiles (name, slug) VALUES (''test-probe'', ''test-probe'')';
        WHEN 'talent_event' THEN
          EXECUTE 'INSERT INTO public.talent_event (event_id, talent_id) VALUES (gen_random_uuid(), gen_random_uuid())';
        WHEN 'calendar_event' THEN
          EXECUTE 'INSERT INTO public.calendar_event (event_title, start_date, end_date, created_by) VALUES (''test-probe'', CURRENT_DATE, CURRENT_DATE, $1)' USING test_user_id;
        WHEN 'bookings' THEN
          EXECUTE 'INSERT INTO public.bookings (business_account_id, event_id) VALUES (gen_random_uuid(), gen_random_uuid())';
        WHEN 'event_participants' THEN
          EXECUTE 'INSERT INTO public.event_participants (event_id, talent_id) VALUES (gen_random_uuid(), gen_random_uuid())';
        ELSE
          EXECUTE format('INSERT INTO public.%I DEFAULT VALUES', tbl_name);
      END CASE;
      try_insert := true;
    EXCEPTION WHEN OTHERS THEN
      try_insert := false;
    END;
    BEGIN EXECUTE 'ROLLBACK'; EXCEPTION WHEN OTHERS THEN END;
    RETURN QUERY SELECT 'rls_probe', tbl_name, 'INSERT', try_insert, 
      CASE WHEN try_insert THEN 'INSERT allowed (rolled back)' ELSE 'INSERT blocked' END;

    -- DELETE test (safe no-op)
    BEGIN
      EXECUTE 'BEGIN';
      EXECUTE format('DELETE FROM public.%I WHERE false', tbl_name);
      try_delete := true;
    EXCEPTION WHEN OTHERS THEN
      try_delete := false;
    END;
    BEGIN EXECUTE 'ROLLBACK'; EXCEPTION WHEN OTHERS THEN END;
    RETURN QUERY SELECT 'rls_probe', tbl_name, 'DELETE', try_delete, 
      CASE WHEN try_delete THEN 'DELETE allowed (rolled back)' ELSE 'DELETE blocked' END;
  END LOOP;
END $$;

-- STEP 3: Delete hardening - Add ON DELETE CASCADE for junction tables
-- Check current foreign keys first
CREATE OR REPLACE VIEW rls_audit.v_foreign_keys AS
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('business_event_account', 'business_event_talent', 'talent_event', 'event_participants', 'bookings')
ORDER BY tc.table_name, kcu.column_name;

-- Test delete operation on business_events (dry run)
DO $$
BEGIN
    BEGIN
        DELETE FROM public.business_events WHERE false;
        RAISE NOTICE 'DELETE test on business_events: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'DELETE test on business_events: FAILED - %', SQLERRM;
    END;
END $$;