-- Create comprehensive test function to validate business account isolation
CREATE OR REPLACE FUNCTION test_business_account_isolation()
RETURNS TABLE(
  test_name text,
  passed boolean,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  jesse_user_id uuid;
  jesse_business_account_id uuid;
  jesse_event_count int;
  total_events_count int;
  jesse_accessible_events int;
BEGIN
  -- Get Jesse's user ID
  SELECT user_id INTO jesse_user_id 
  FROM profiles 
  WHERE email = 'jesse@funkoflash.com' 
  LIMIT 1;

  -- Get Jesse's business account
  SELECT id INTO jesse_business_account_id
  FROM business_account
  WHERE contact_email = 'jesse@funkoflash.com'
  LIMIT 1;

  -- Count total business events in calendar
  SELECT COUNT(*) INTO total_events_count
  FROM calendar_event ce
  WHERE source_row_id IS NOT NULL;

  -- Count events Jesse should see (assigned to his business account)
  SELECT COUNT(*) INTO jesse_event_count
  FROM calendar_event ce
  WHERE source_row_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM business_event_account bea
      JOIN business_account ba ON ba.id = bea.business_account_id
      WHERE bea.event_id::text = ce.source_row_id
        AND ba.contact_email = 'jesse@funkoflash.com'
    );

  -- Simulate what Jesse would see with RLS (count accessible events)
  -- Note: This simulates the RLS policy without actual user context switch
  SELECT COUNT(*) INTO jesse_accessible_events
  FROM calendar_event ce
  WHERE source_row_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM business_event_account bea
      JOIN business_account ba ON ba.id = bea.business_account_id
      JOIN profiles p ON p.email = ba.contact_email
      WHERE bea.event_id::text = ce.source_row_id
        AND p.user_id = jesse_user_id
        AND p.role = 'business'::app_role
    );

  -- Test 1: Jesse should have limited access
  RETURN QUERY SELECT 
    'Jesse event access limitation'::text,
    (jesse_accessible_events < total_events_count)::boolean,
    format('Jesse can access %s out of %s total business events', jesse_accessible_events, total_events_count)::text;

  -- Test 2: Jesse should see only his business account events
  RETURN QUERY SELECT 
    'Jesse business account isolation'::text,
    (jesse_accessible_events = jesse_event_count)::boolean,
    format('Jesse should see %s events, RLS allows %s events', jesse_event_count, jesse_accessible_events)::text;

  -- Test 3: Verify no broad calendar:view permission for business users
  RETURN QUERY SELECT 
    'Business role permission scope'::text,
    NOT EXISTS (
      SELECT 1 FROM role_permissions 
      WHERE role_key = 'business'::app_role 
      AND permission_scope = 'calendar:view'
    )::boolean,
    'Business role should not have broad calendar:view permission'::text;

  -- Test 4: Verify scoped permission exists
  RETURN QUERY SELECT 
    'Scoped business permission exists'::text,
    EXISTS (
      SELECT 1 FROM role_permissions 
      WHERE role_key = 'business'::app_role 
      AND permission_scope = 'calendar:view_own_business'
    )::boolean,
    'Business role should have scoped calendar:view_own_business permission'::text;

END;
$$;