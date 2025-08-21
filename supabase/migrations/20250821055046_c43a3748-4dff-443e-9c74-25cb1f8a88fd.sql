-- Security Fix Phase 4: Address linter warnings and continue with remaining fixes

-- Fix the SECURITY DEFINER view issue by removing SECURITY DEFINER
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  avatar_url,
  role,
  active,
  status,
  name_color,
  background_image_url,
  business_name
FROM profiles
WHERE active = true;

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;

-- Security Fix Phase 5: Enhanced login history access
DROP POLICY IF EXISTS "Admins can view all login history" ON user_login_history;
DROP POLICY IF EXISTS "Staff can view all login history" ON user_login_history;

CREATE POLICY "Admin/staff can view all login history"
ON user_login_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Users can view their own login history"
ON user_login_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admin/staff can manage login history"
ON user_login_history
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Security Fix Phase 6: Enhanced message attachment validation
-- Create a function to validate attachment URLs
CREATE OR REPLACE FUNCTION validate_attachment_url(url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow null/empty URLs
  IF url IS NULL OR url = '' THEN
    RETURN true;
  END IF;
  
  -- Only allow URLs from trusted domains (Supabase storage)
  IF url ~ '^https://gytjgmeoepglbrjrbfie\.supabase\.co/storage/v1/object/public/message-attachments/' THEN
    RETURN true;
  END IF;
  
  -- Block all other URLs
  RETURN false;
END;
$$;

-- Add validation to messages table
ALTER TABLE messages ADD CONSTRAINT valid_attachment_url 
CHECK (validate_attachment_url(attachment_url));

-- Security Fix Phase 7: Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admin/staff can access audit logs
CREATE POLICY "Admin/staff can view audit logs"
ON security_audit_log
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;