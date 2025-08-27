-- Phase 1: Security Fix - Add permission first, then implement business account isolation

-- Step 1: Add the new scoped permission to the permissions table
INSERT INTO permissions (scope, description)
VALUES ('calendar:view_own_business', 'View calendar events for assigned business accounts only')
ON CONFLICT (scope) DO NOTHING;

-- Step 2: Drop the overly broad policy that allows ANY user with calendar:view to see ALL events
DROP POLICY IF EXISTS "Users with calendar:view can view events" ON calendar_event;

-- Step 3: Create a scoped policy specifically for business users to only see their assigned events
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

-- Step 4: Update role_permissions to replace broad calendar:view with scoped business permissions
-- Remove the broad calendar:view permission for business role
DELETE FROM role_permissions 
WHERE role_key = 'business'::app_role 
  AND permission_scope = 'calendar:view';

-- Add the new scoped permission for business users
INSERT INTO role_permissions (role_key, permission_scope)
VALUES ('business'::app_role, 'calendar:view_own_business')
ON CONFLICT (role_key, permission_scope) DO NOTHING;

-- Step 5: Add audit logging table for business event access monitoring
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