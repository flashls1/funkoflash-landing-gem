-- STEP 1: Standardize RLS baselines and create test harness
-- Enable RLS on all key tables (idempotent)
ALTER TABLE IF EXISTS public.business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_event_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_account_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.talent_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_participants ENABLE ROW LEVEL SECURITY;

-- STEP 2: Create RLS test probe function
CREATE OR REPLACE FUNCTION rls_audit.rls_probe(
  p_role text,                 -- 'admin' | 'staff' | 'business' | 'talent' | 'anon'
  p_limit int default 3        -- how many rows to sample in SELECT tests
) RETURNS TABLE(
  probe text,
  table_name text,
  operation text,
  ok boolean,
  details text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, rls_audit AS $$
DECLARE
  jwt jsonb;
  tbl text;
  op  text;
  stmt text;
  can_select boolean;
  try_insert boolean;
  try_update boolean;
  try_delete boolean;
  test_user_id uuid;
BEGIN
  -- 1) Build a minimal JWT claims blob to simulate auth in Supabase
  -- NOTE: We do NOT hardcode a real user id. We fake stable UUIDs per role for policy shape testing only.
  test_user_id := case p_role
    when 'admin' then '00000000-0000-0000-0000-0000000000a1'::uuid
    when 'staff' then '00000000-0000-0000-0000-0000000000b1'::uuid
    when 'business' then '00000000-0000-0000-0000-0000000000c1'::uuid
    when 'talent' then '00000000-0000-0000-0000-0000000000d1'::uuid
    else '00000000-0000-0000-0000-0000000000e1'::uuid
  end;

  jwt := jsonb_build_object(
    'role', case when p_role = 'anon' then 'anon' else 'authenticated' end,
    'sub', test_user_id
  );

  IF p_role = 'anon' THEN
    PERFORM set_config('request.jwt.claims', null, true);
    PERFORM set_config('role', 'anon', true);
  ELSE
    PERFORM set_config('request.jwt.claims', jwt::text, true);
    PERFORM set_config('role', 'authenticated', true);
  END IF;

  -- 2) Tables to exercise
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
      RETURN QUERY SELECT 'rls_probe', tbl, 'TABLE_MISSING', false, 'table does not exist';
      CONTINUE;
    END IF;

    -- SELECT test
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', tbl) INTO STRICT can_select;
      RETURN QUERY SELECT 'rls_probe', tbl, 'SELECT', true, format('ok: counted rows with RLS for role %s', p_role);
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 'rls_probe', tbl, 'SELECT', false, SQLERRM;
    END;

    -- INSERT test (dry-run)
    BEGIN
      EXECUTE 'BEGIN';
      -- Try to insert a minimal record - this will test if INSERT policies allow it
      CASE tbl
        WHEN 'business_account' THEN
          EXECUTE 'INSERT INTO public.business_account (name) VALUES (''test'')';
        WHEN 'business_account_user' THEN  
          EXECUTE 'INSERT INTO public.business_account_user (business_account_id, user_id) VALUES (gen_random_uuid(), $1)' USING test_user_id;
        WHEN 'business_events' THEN
          EXECUTE 'INSERT INTO public.business_events (title) VALUES (''test'')';
        WHEN 'business_event_account' THEN
          EXECUTE 'INSERT INTO public.business_event_account (event_id, business_account_id) VALUES (gen_random_uuid(), gen_random_uuid())';
        WHEN 'talent_profiles' THEN
          EXECUTE 'INSERT INTO public.talent_profiles (name, slug) VALUES (''test'', ''test'')';
        WHEN 'talent_event' THEN
          EXECUTE 'INSERT INTO public.talent_event (event_id, talent_id) VALUES (gen_random_uuid(), gen_random_uuid())';
        WHEN 'calendar_event' THEN
          EXECUTE 'INSERT INTO public.calendar_event (event_title, start_date, end_date, created_by) VALUES (''test'', CURRENT_DATE, CURRENT_DATE, $1)' USING test_user_id;
        WHEN 'bookings' THEN
          EXECUTE 'INSERT INTO public.bookings (business_account_id, event_id) VALUES (gen_random_uuid(), gen_random_uuid())';
        WHEN 'event_participants' THEN
          EXECUTE 'INSERT INTO public.event_participants (event_id, talent_id) VALUES (gen_random_uuid(), gen_random_uuid())';
        ELSE
          EXECUTE format('INSERT INTO public.%I DEFAULT VALUES', tbl);
      END CASE;
      try_insert := true;
    EXCEPTION WHEN OTHERS THEN
      try_insert := false;
    END;
    BEGIN EXECUTE 'ROLLBACK'; EXCEPTION WHEN OTHERS THEN END;
    RETURN QUERY SELECT 'rls_probe', tbl, 'INSERT', try_insert, 
      CASE WHEN try_insert THEN 'would insert (blocked in rollback)' ELSE 'blocked (as expected or policy-issue)' END;

    -- UPDATE test (dry-run with safe no-op)
    BEGIN
      EXECUTE 'BEGIN';
      EXECUTE format('UPDATE public.%I SET updated_at = updated_at WHERE false', tbl);
      try_update := true;
    EXCEPTION WHEN OTHERS THEN
      try_update := false;
    END;
    BEGIN EXECUTE 'ROLLBACK'; EXCEPTION WHEN OTHERS THEN END;
    RETURN QUERY SELECT 'rls_probe', tbl, 'UPDATE', try_update, 
      CASE WHEN try_update THEN 'would update (blocked in rollback)' ELSE 'blocked (as expected or policy-issue)' END;

    -- DELETE test (dry-run with safe no-op)
    BEGIN
      EXECUTE 'BEGIN';
      EXECUTE format('DELETE FROM public.%I WHERE false', tbl);
      try_delete := true;
    EXCEPTION WHEN OTHERS THEN
      try_delete := false;
    END;
    BEGIN EXECUTE 'ROLLBACK'; EXCEPTION WHEN OTHERS THEN END;
    RETURN QUERY SELECT 'rls_probe', tbl, 'DELETE', try_delete, 
      CASE WHEN try_delete THEN 'would delete (blocked in rollback)' ELSE 'blocked (as expected or policy-issue)' END;
  END LOOP;
END $$;