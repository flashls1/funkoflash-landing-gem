-- Security Fix Phase 8: Fix function search path issues and remaining warnings

-- Fix search path for validate_attachment_url function
CREATE OR REPLACE FUNCTION validate_attachment_url(url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix search path for log_security_event function
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
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;

-- Create a trigger to automatically log profile role changes for security auditing
CREATE OR REPLACE FUNCTION audit_profile_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM log_security_event(
      'profile_role_changed',
      'profiles',
      NEW.id,
      jsonb_build_object('old_role', OLD.role),
      jsonb_build_object('new_role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add the trigger for profile role changes
DROP TRIGGER IF EXISTS audit_profile_role_changes_trigger ON profiles;
CREATE TRIGGER audit_profile_role_changes_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_role_changes();