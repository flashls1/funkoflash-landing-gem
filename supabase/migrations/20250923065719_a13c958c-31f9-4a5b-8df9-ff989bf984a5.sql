-- COMPREHENSIVE FUNCTION SECURITY UPDATE - BATCH 2
-- Continue updating remaining functions with proper security settings

CREATE OR REPLACE FUNCTION public.connect_talent_to_user(p_talent_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_role public.app_role;
BEGIN
  -- Only allow admin/staff to connect profiles
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to connect talent profiles';
  END IF;
  
  -- Check if user exists and get their role
  SELECT role INTO v_user_role FROM public.profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Only allow connecting to talent users
  IF v_user_role != 'talent'::public.app_role THEN
    RAISE EXCEPTION 'Can only connect to users with talent role';
  END IF;
  
  -- Check if talent profile exists and is not already connected
  IF NOT EXISTS (SELECT 1 FROM public.talent_profiles WHERE id = p_talent_id AND user_id IS NULL) THEN
    RAISE EXCEPTION 'Talent profile not found or already connected to a user';
  END IF;
  
  -- Check if user already has a talent profile
  IF EXISTS (SELECT 1 FROM public.talent_profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'User already has a talent profile';
  END IF;
  
  -- Connect the talent profile to the user
  UPDATE public.talent_profiles 
  SET user_id = p_user_id, updated_at = now()
  WHERE id = p_talent_id;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_admin_talent_profile(p_name text, p_slug text, p_bio text DEFAULT NULL::text, p_headshot_url text DEFAULT NULL::text, p_active boolean DEFAULT true, p_sort_rank integer DEFAULT 0, p_public_visibility boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_talent_id UUID;
BEGIN
  -- Only allow admin/staff to create talent profiles
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to create talent profiles';
  END IF;
  
  v_talent_id := gen_random_uuid();
  
  -- Insert the talent profile without user_id dependency
  INSERT INTO public.talent_profiles (
    id,
    user_id,
    name,
    slug,
    bio,
    headshot_url,
    active,
    public_visibility,
    sort_rank
  ) VALUES (
    v_talent_id,
    NULL, -- No user association required
    p_name,
    p_slug,
    p_bio,
    p_headshot_url,
    p_active,
    p_public_visibility,
    p_sort_rank
  );
  
  RETURN v_talent_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_calendar_year(p_talent_id uuid, p_year integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_from date := make_date(p_year, 1, 1);
  v_to   date := make_date(p_year + 1, 1, 1);
  v_count integer;
BEGIN
  DELETE FROM public.calendar_event
   WHERE talent_id = p_talent_id
     AND start_date >= v_from
     AND start_date <  v_to;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_corrupted_talent_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only allow admin/staff to run this
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to delete talent profiles';
  END IF;
  
  -- Delete the specified profile
  DELETE FROM public.talent_profiles WHERE id = p_profile_id;
  
  -- Return true if a profile was deleted
  RETURN FOUND;
END;
$function$;