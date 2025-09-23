-- COMPREHENSIVE FUNCTION SECURITY UPDATE - BATCH 1
-- Update ALL functions to use SECURITY DEFINER and SET search_path = '' to prevent privilege escalation

-- Fix main functions with proper enum handling
CREATE OR REPLACE FUNCTION public.can_modify_user_role(target_user_id uuid, new_role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_role public.app_role;
  target_user_role public.app_role;
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
RETURNS TABLE(cleaned_profile_id uuid, profile_name text, user_role public.app_role, cleanup_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only allow admin/staff to run this
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to cleanup talent profiles';
  END IF;
  
  -- First, clean up profiles with corrupted user_id references (where user_id = profile id)
  RETURN QUERY
  UPDATE public.talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  WHERE user_id = id
    AND active = true
  RETURNING talent_profiles.id, talent_profiles.name, 'corrupted'::public.app_role, 'self_reference_cleanup';
  
  -- Then, clean up profiles linked to non-talent users
  RETURN QUERY
  UPDATE public.talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  FROM public.profiles p
  WHERE talent_profiles.user_id = p.user_id 
    AND p.role != 'talent'::public.app_role 
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
  RETURNING talent_profiles.id, talent_profiles.name, 'orphaned'::public.app_role, 'orphaned_user_cleanup';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_business_accounts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  cleanup_summary JSONB;
  orphaned_count INTEGER;
  assignments_count INTEGER;
BEGIN
  -- Only allow admin/staff to run this
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to cleanup orphaned business accounts';
  END IF;
  
  -- Clean up orphaned business event assignments first
  DELETE FROM public.business_event_account 
  WHERE business_account_id IN (
    SELECT ba.id
    FROM public.business_account ba
    LEFT JOIN public.profiles p ON p.email = ba.contact_email
    WHERE p.id IS NULL
      AND ba.contact_email IS NOT NULL
      AND ba.contact_email != ''
  );
  GET DIAGNOSTICS assignments_count = ROW_COUNT;
  
  -- Get count of orphaned business accounts
  SELECT COUNT(*) INTO orphaned_count
  FROM public.business_account ba
  LEFT JOIN public.profiles p ON p.email = ba.contact_email
  WHERE p.id IS NULL
    AND ba.contact_email IS NOT NULL
    AND ba.contact_email != '';
  
  -- Clean up orphaned business accounts
  DELETE FROM public.business_account 
  WHERE id IN (
    SELECT ba.id
    FROM public.business_account ba
    LEFT JOIN public.profiles p ON p.email = ba.contact_email
    WHERE p.id IS NULL
      AND ba.contact_email IS NOT NULL
      AND ba.contact_email != ''
  );
  
  cleanup_summary := jsonb_build_object(
    'orphaned_accounts_deleted', orphaned_count,
    'orphaned_assignments_deleted', assignments_count,
    'cleanup_timestamp', now(),
    'cleaned_by', auth.uid()
  );
  
  -- Log the cleanup
  PERFORM public.log_security_event(
    'orphaned_business_accounts_cleanup',
    'business_account',
    NULL,
    NULL,
    cleanup_summary
  );
  
  RETURN cleanup_summary;
END;
$function$;