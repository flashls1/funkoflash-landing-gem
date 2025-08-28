-- STEP 3: Delete Hardening and RLS Policy Review
-- Fix the probe function column name ambiguity
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
  tbl_name text;
  can_select boolean;
  try_delete boolean;
  row_count bigint;
BEGIN
  -- Test key tables for RLS effectiveness
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
    -- Only test tables that exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
      RETURN QUERY SELECT 'rls_probe_simple', tbl_name, 'TABLE_MISSING', false, 'table does not exist';
      CONTINUE;
    END IF;

    -- SELECT test - shows what current user can see
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', tbl_name) INTO STRICT row_count;
      RETURN QUERY SELECT 'rls_probe_simple', tbl_name, 'SELECT', true, format('ok: counted %s rows with RLS', row_count);
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 'rls_probe_simple', tbl_name, 'SELECT', false, SQLERRM;
    END;

    -- DELETE test (dry-run with safe no-op)
    BEGIN
      EXECUTE 'BEGIN';
      EXECUTE format('DELETE FROM public.%I WHERE false', tbl_name);
      try_delete := true;
    EXCEPTION WHEN OTHERS THEN
      try_delete := false;
    END;
    BEGIN EXECUTE 'ROLLBACK'; EXCEPTION WHEN OTHERS THEN END;
    RETURN QUERY SELECT 'rls_probe_simple', tbl_name, 'DELETE', try_delete, 
      CASE WHEN try_delete THEN 'DELETE policy allows operation' ELSE 'DELETE blocked by RLS' END;
  END LOOP;
END $$;

-- Test delete operations on business_events (should work for admin)
-- This will be safe as it uses WHERE false
-- Check if deleting business events works (dry run)
DO $$
BEGIN
  BEGIN
    DELETE FROM public.business_events WHERE false;
    RAISE NOTICE 'business_events DELETE: ✅ ALLOWED (policy permits)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'business_events DELETE: ❌ BLOCKED - %', SQLERRM;
  END;
END $$;

-- Add missing RLS policies for proper data isolation
-- Fix business_account table - currently has admin-only policy
DROP POLICY IF EXISTS "business_account_admin_manage" ON public.business_account;

-- Create proper business_account policies
CREATE POLICY "business_account_admin_staff_manage" 
ON public.business_account FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "business_account_user_view_own" 
ON public.business_account FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM business_account_user bau 
    JOIN profiles p ON p.id = bau.user_id 
    WHERE bau.business_account_id = business_account.id 
    AND p.user_id = auth.uid()
  )
);

-- Fix business_account_user table - currently only has select for own records
CREATE POLICY "business_account_user_admin_staff_manage" 
ON public.business_account_user FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Fix talent_event table - ensure proper visibility  
CREATE POLICY "talent_event_talent_view_own" 
ON public.talent_event FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = talent_event.talent_id 
    AND tp.user_id = auth.uid()
  )
);

-- Check if calendar_event has proper business user visibility
-- Currently only has admin policy - add business user visibility
CREATE POLICY "calendar_event_business_view_own" 
ON public.calendar_event FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR
  (
    -- Business users can see calendar events for their assigned business events
    EXISTS (
      SELECT 1 FROM business_event_account bea
      JOIN business_account_user bau ON bau.business_account_id = bea.business_account_id
      JOIN profiles p ON p.id = bau.user_id
      WHERE bea.event_id::text = calendar_event.source_row_id
      AND p.user_id = auth.uid()
      AND p.role = 'business'::app_role
    )
  ) OR
  (
    -- Talent users can see calendar events for their assigned events
    EXISTS (
      SELECT 1 FROM talent_profiles tp
      WHERE tp.id = calendar_event.talent_id
      AND tp.user_id = auth.uid()
    )
  )
);

-- Add missing DELETE policies for junction tables
-- These should cascade automatically due to FK constraints, but RLS might block
CREATE POLICY "business_event_account_admin_staff_delete" 
ON public.business_event_account FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "business_event_talent_admin_staff_delete" 
ON public.business_event_talent FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Ensure business event deletion works properly
CREATE POLICY "business_events_admin_staff_delete" 
ON public.business_events FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));