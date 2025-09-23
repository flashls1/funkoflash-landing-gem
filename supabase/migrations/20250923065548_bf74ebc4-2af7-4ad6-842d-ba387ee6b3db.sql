-- COMPREHENSIVE FUNCTION SECURITY UPDATE
-- Update ALL functions to use SECURITY DEFINER and SET search_path = '' to prevent privilege escalation

-- Update functions with incorrect search_path
CREATE OR REPLACE FUNCTION public.audit_profile_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_security_event(
      'profile_role_changed',
      'profiles',
      NEW.id,
      jsonb_build_object('old_role', OLD.role),
      jsonb_build_object('new_role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_modify_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_role app_role;
  target_user_role app_role;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role FROM public.profiles WHERE user_id = auth.uid();
  
  -- Get target user's current role
  SELECT role INTO target_user_role FROM public.profiles WHERE user_id = target_user_id;
  
  -- Only admin and staff can modify roles
  IF current_user_role NOT IN ('admin', 'staff') THEN
    RETURN false;
  END IF;
  
  -- Users cannot modify their own role
  IF auth.uid() = target_user_id THEN
    RETURN false;
  END IF;
  
  -- Log the role modification attempt
  PERFORM public.log_security_event(
    'role_modification_attempted',
    'profiles',
    target_user_id,
    jsonb_build_object('current_role', target_user_role),
    jsonb_build_object('requested_role', new_role, 'requested_by', auth.uid())
  );
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_business_talent_profiles()
RETURNS TABLE(cleaned_profile_id uuid, profile_name text, user_role app_role, cleanup_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only allow admin/staff to run this
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to cleanup talent profiles';
  END IF;
  
  -- First, clean up profiles with corrupted user_id references (where user_id = profile id)
  RETURN QUERY
  UPDATE public.talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  WHERE user_id = id
    AND active = true
  RETURNING talent_profiles.id, talent_profiles.name, 'corrupted'::app_role, 'self_reference_cleanup';
  
  -- Then, clean up profiles linked to non-talent users
  RETURN QUERY
  UPDATE public.talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  FROM public.profiles p
  WHERE talent_profiles.user_id = p.user_id 
    AND p.role != 'talent'::app_role 
    AND talent_profiles.active = true
    AND talent_profiles.user_id != talent_profiles.id -- Avoid already cleaned up profiles
  RETURNING talent_profiles.id, talent_profiles.name, p.role, 'role_mismatch_cleanup';
  
  -- Finally, clean up profiles with user_ids that don't exist in profiles table
  RETURN QUERY
  UPDATE public.talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  WHERE talent_profiles.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = talent_profiles.user_id)
    AND active = true
  RETURNING talent_profiles.id, talent_profiles.name, 'orphaned'::app_role, 'orphaned_user_cleanup';
END;
$function$;