-- Drop and recreate the get_public_talent_showcase function with new signature
DROP FUNCTION IF EXISTS public.get_public_talent_showcase();

CREATE OR REPLACE FUNCTION public.get_public_talent_showcase()
 RETURNS TABLE(id uuid, name character varying, slug character varying, headshot_url text, preview_bio text, sort_rank integer, has_user_account boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    tp.id,
    tp.name,
    tp.slug,
    tp.headshot_url,
    CASE
      WHEN (tp.bio IS NOT NULL AND length(tp.bio) > 0) 
      THEN (left(tp.bio, 200) || '...')
      ELSE NULL
    END AS preview_bio,
    tp.sort_rank,
    (tp.user_id IS NOT NULL) AS has_user_account
  FROM talent_profiles tp
  WHERE tp.active = true 
    AND tp.public_visibility = true
    AND (
      tp.user_id IS NULL  -- Admin-created profiles without users
      OR EXISTS (          -- User-linked profiles where user role is talent
        SELECT 1 FROM profiles p 
        WHERE p.user_id = tp.user_id 
        AND p.role = 'talent'::app_role
      )
    )
  ORDER BY tp.sort_rank ASC;
$function$;

-- Add function to connect talent profile to user account
CREATE OR REPLACE FUNCTION public.connect_talent_to_user(p_talent_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_role app_role;
BEGIN
  -- Only allow admin/staff to connect profiles
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to connect talent profiles';
  END IF;
  
  -- Check if user exists and get their role
  SELECT role INTO v_user_role FROM profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Only allow connecting to talent users
  IF v_user_role != 'talent'::app_role THEN
    RAISE EXCEPTION 'Can only connect to users with talent role';
  END IF;
  
  -- Check if talent profile exists and is not already connected
  IF NOT EXISTS (SELECT 1 FROM talent_profiles WHERE id = p_talent_id AND user_id IS NULL) THEN
    RAISE EXCEPTION 'Talent profile not found or already connected to a user';
  END IF;
  
  -- Check if user already has a talent profile
  IF EXISTS (SELECT 1 FROM talent_profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'User already has a talent profile';
  END IF;
  
  -- Connect the talent profile to the user
  UPDATE talent_profiles 
  SET user_id = p_user_id, updated_at = now()
  WHERE id = p_talent_id;
  
  RETURN TRUE;
END;
$function$;

-- Add function to get available users for talent connection
CREATE OR REPLACE FUNCTION public.get_available_talent_users()
 RETURNS TABLE(user_id uuid, name text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admin/staff to view this
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to view available users';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    COALESCE(TRIM(p.first_name || ' ' || p.last_name), TRIM(p.first_name), p.email) as name,
    p.email
  FROM profiles p
  WHERE p.role = 'talent'::app_role
    AND p.active = true
    AND NOT EXISTS (
      SELECT 1 FROM talent_profiles tp WHERE tp.user_id = p.user_id
    )
  ORDER BY p.first_name, p.last_name;
END;
$function$;