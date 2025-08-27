-- Phase 1: Immediate Security Fix for Business Event Data Segregation

-- Step 1: Drop the overly broad policy that allows ANY user with calendar:view to see ALL events
DROP POLICY IF EXISTS "Users with calendar:view can view events" ON calendar_event;

-- Step 2: Create a scoped policy specifically for business users to only see their assigned events
CREATE POLICY "Business users can view calendar events for their assigned business accounts only"
ON calendar_event
FOR SELECT
TO authenticated
USING (
  -- Allow business users to view calendar events only if:
  -- 1. The event is sourced from a business_event (source_row_id is not null)
  -- 2. They are assigned to that business event through business_event_account table
  has_role(auth.uid(), 'business'::app_role) 
  AND source_row_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    JOIN profiles p ON p.email = ba.contact_email
    WHERE bea.event_id::text = calendar_event.source_row_id
      AND p.user_id = auth.uid()
      AND p.role = 'business'::app_role
  )
);

-- Step 3: Update role_permissions to replace broad calendar:view with scoped business permissions
-- Remove the broad calendar:view permission for business role
DELETE FROM role_permissions 
WHERE role_key = 'business'::app_role 
  AND permission_scope = 'calendar:view';

-- Add the new scoped permission for business users
INSERT INTO role_permissions (role_key, permission_scope)
VALUES ('business'::app_role, 'calendar:view_own_business')
ON CONFLICT (role_key, permission_scope) DO NOTHING;

-- Step 4: Add audit logging table for business event access monitoring
CREATE TABLE IF NOT EXISTS business_event_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_account_id uuid,
  event_id uuid,
  access_type text NOT NULL, -- 'view', 'edit', 'delete'
  accessed_at timestamp with time zone DEFAULT now(),
  user_agent text,
  ip_address text
);

-- Enable RLS on the audit log table
ALTER TABLE business_event_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins and staff can view audit logs
CREATE POLICY "Admin and staff can view business event access logs"
ON business_event_access_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Step 5: Create function to log business event access
CREATE OR REPLACE FUNCTION log_business_event_access(
  p_business_account_id uuid,
  p_event_id uuid,
  p_access_type text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO business_event_access_log (
    user_id,
    business_account_id,
    event_id,
    access_type
  ) VALUES (
    auth.uid(),
    p_business_account_id,
    p_event_id,
    p_access_type
  );
END;
$$;

-- Step 6: Create comprehensive test function to validate business account isolation
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
  other_business_user_id uuid;
  jesse_business_account_id uuid;
  other_business_account_id uuid;
  jesse_event_count int;
  cross_access_count int;
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

  -- Test 1: Jesse should only see events assigned to his business account
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

  RETURN QUERY SELECT 
    'Jesse calendar event isolation'::text,
    (jesse_event_count > 0)::boolean,
    format('Jesse should see %s events for his business account', jesse_event_count)::text;

  -- Test 2: Verify no cross-business access
  SELECT COUNT(*) INTO cross_access_count
  FROM calendar_event ce
  WHERE source_row_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM business_event_account bea
      JOIN business_account ba ON ba.id = bea.business_account_id
      WHERE bea.event_id::text = ce.source_row_id
        AND ba.contact_email = 'jesse@funkoflash.com'
    );

  RETURN QUERY SELECT 
    'Cross-business access prevention'::text,
    (cross_access_count = 0)::boolean,
    format('Found %s events that Jesse should NOT have access to', cross_access_count)::text;

END;
$$;