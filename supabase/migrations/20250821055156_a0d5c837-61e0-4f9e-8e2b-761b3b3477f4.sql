-- Security Fix Phase 9: Final cleanup and frontend integration preparation

-- Add validation function for role modifications in frontend
CREATE OR REPLACE FUNCTION can_modify_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role app_role;
  target_user_role app_role;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role FROM profiles WHERE user_id = auth.uid();
  
  -- Get target user's current role
  SELECT role INTO target_user_role FROM profiles WHERE user_id = target_user_id;
  
  -- Only admin and staff can modify roles
  IF current_user_role NOT IN ('admin', 'staff') THEN
    RETURN false;
  END IF;
  
  -- Users cannot modify their own role
  IF auth.uid() = target_user_id THEN
    RETURN false;
  END IF;
  
  -- Log the role modification attempt
  PERFORM log_security_event(
    'role_modification_attempted',
    'profiles',
    target_user_id,
    jsonb_build_object('current_role', target_user_role),
    jsonb_build_object('requested_role', new_role, 'requested_by', auth.uid())
  );
  
  RETURN true;
END;
$$;

-- Create a function to safely update user roles with proper validation
CREATE OR REPLACE FUNCTION update_user_role_safely(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the modification is allowed
  IF NOT can_modify_user_role(target_user_id, new_role) THEN
    RAISE EXCEPTION 'Insufficient permissions to modify user role';
  END IF;
  
  -- Update the role
  UPDATE profiles SET role = new_role WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;

-- Add a function to securely fetch user profiles for admin/staff
CREATE OR REPLACE FUNCTION get_user_profiles_for_management()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role app_role,
  active boolean,
  last_login timestamp with time zone,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admin/staff to access this
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to access user management data';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.active,
    p.last_login,
    p.avatar_url
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;