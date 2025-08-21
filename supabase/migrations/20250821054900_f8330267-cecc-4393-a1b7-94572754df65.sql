-- Security Fix 1: Enhanced Google Calendar token access policies
-- Keep existing admin/staff access but add more restrictive policies for other users
DROP POLICY IF EXISTS "Talent can manage their own Google Calendar connection" ON gcal_connections;

CREATE POLICY "Talent can view their own Google Calendar connection"
ON gcal_connections
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = gcal_connections.talent_id 
    AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "Talent can update their own Google Calendar connection"
ON gcal_connections
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = gcal_connections.talent_id 
    AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "Only admin/staff can insert Google Calendar connections"
ON gcal_connections
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Only admin/staff can delete Google Calendar connections"
ON gcal_connections
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Security Fix 2: Restrict login history access to own records
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

-- Security Fix 3: Enhanced profile data protection with granular access
DROP POLICY IF EXISTS "Users can view their own complete profile" ON profiles;

CREATE POLICY "Users can view their own complete profile"
ON profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin/staff can view all complete profiles"
ON profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Create a restricted view for public profile access (business users viewing talent)
CREATE OR REPLACE VIEW public_profiles AS
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

-- Security Fix 4: Make talent_profiles.user_id non-nullable and add constraints
-- First update any existing records that might have null user_id
UPDATE talent_profiles SET user_id = id WHERE user_id IS NULL;

-- Now make the column non-nullable
ALTER TABLE talent_profiles ALTER COLUMN user_id SET NOT NULL;

-- Add a unique constraint to prevent duplicate user_id entries
ALTER TABLE talent_profiles ADD CONSTRAINT unique_talent_user_id UNIQUE (user_id);

-- Security Fix 5: Enhanced message attachment validation
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

-- Security Fix 6: Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
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