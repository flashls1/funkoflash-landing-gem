-- FINAL COMPREHENSIVE FUNCTION SECURITY UPDATE - Fix ALL remaining functions

-- Update all remaining functions that still have SET search_path = 'public' to use SET search_path = ''

-- Functions already updated in previous batches are skipped to avoid conflicts
-- This final batch updates ALL remaining functions that still need fixing

-- Get all function definitions and recreate them with proper security
-- Note: Some functions like debug functions and testing functions can use INVOKER for debugging purposes

CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(id uuid, user_id uuid, first_name text, last_name text, avatar_url text, role public.app_role, active boolean, status text, name_color text, background_image_url text, business_name text)
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.role,
    p.active,
    p.status,
    p.name_color,
    p.background_image_url,
    p.business_name
  FROM public.profiles p
  WHERE p.active = true;
$function$;

CREATE OR REPLACE FUNCTION public.get_business_account_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_business_account_id uuid;
  v_profile public.profiles%ROWTYPE;
BEGIN
  -- Get the user profile
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- First try to find business account by email (most reliable)
  SELECT id INTO v_business_account_id 
  FROM public.business_account 
  WHERE contact_email = v_profile.email
  LIMIT 1;

  -- If not found by email and user has business_name, try by business_name
  IF v_business_account_id IS NULL AND v_profile.business_name IS NOT NULL THEN
    SELECT id INTO v_business_account_id 
    FROM public.business_account 
    WHERE name = v_profile.business_name
    LIMIT 1;
  END IF;

  -- If not found by business_name, try by constructed name
  IF v_business_account_id IS NULL THEN
    SELECT id INTO v_business_account_id 
    FROM public.business_account 
    WHERE name = v_profile.first_name || ' ' || COALESCE(v_profile.last_name, '')
    LIMIT 1;
  END IF;

  RETURN v_business_account_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT role FROM public.profiles WHERE user_id = p_user_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_users_for_messaging()
RETURNS TABLE(user_id uuid, display_name text, role public.app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT 
    p.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.first_name, p.email) as display_name,
    p.role
  FROM public.profiles p
  WHERE p.active = true
  AND p.user_id != auth.uid(); -- Exclude current user
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profiles_for_management()
RETURNS TABLE(id uuid, user_id uuid, email text, first_name text, last_name text, role public.app_role, active boolean, last_login timestamp with time zone, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only allow admin/staff to access this
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)) THEN
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
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$function$;