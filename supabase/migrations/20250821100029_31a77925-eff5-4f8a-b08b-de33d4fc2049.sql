-- Clean up the corrupted Mario Castañeda profile and improve cleanup functions

-- First, delete the corrupted Mario Castañeda profile
DELETE FROM talent_profiles 
WHERE id = 'b14c5de3-c1d1-4824-b9aa-2e82dba73eed' 
  AND user_id = 'b14c5de3-c1d1-4824-b9aa-2e82dba73eed';

-- Delete any other profiles where user_id equals the profile id (corrupted self-references)
DELETE FROM talent_profiles 
WHERE user_id = id;

-- Update the cleanup function to handle corrupted profiles and improve error handling
CREATE OR REPLACE FUNCTION public.cleanup_business_talent_profiles()
RETURNS TABLE(cleaned_profile_id uuid, profile_name text, user_role app_role, cleanup_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admin/staff to run this
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to cleanup talent profiles';
  END IF;
  
  -- First, clean up profiles with corrupted user_id references (where user_id = profile id)
  RETURN QUERY
  UPDATE talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  WHERE user_id = id
    AND active = true
  RETURNING talent_profiles.id, talent_profiles.name, 'corrupted'::app_role, 'self_reference_cleanup';
  
  -- Then, clean up profiles linked to non-talent users
  RETURN QUERY
  UPDATE talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  FROM profiles p
  WHERE talent_profiles.user_id = p.user_id 
    AND p.role != 'talent'::app_role 
    AND talent_profiles.active = true
    AND talent_profiles.user_id != talent_profiles.id -- Avoid already cleaned up profiles
  RETURNING talent_profiles.id, talent_profiles.name, p.role, 'role_mismatch_cleanup';
  
  -- Finally, clean up profiles with user_ids that don't exist in profiles table
  RETURN QUERY
  UPDATE talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  WHERE talent_profiles.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = talent_profiles.user_id)
    AND active = true
  RETURNING talent_profiles.id, talent_profiles.name, 'orphaned'::app_role, 'orphaned_user_cleanup';
END;
$function$;

-- Create a function to delete specific corrupted talent profiles by ID
CREATE OR REPLACE FUNCTION public.delete_corrupted_talent_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admin/staff to run this
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to delete talent profiles';
  END IF;
  
  -- Delete the specified profile
  DELETE FROM talent_profiles WHERE id = p_profile_id;
  
  -- Return true if a profile was deleted
  RETURN FOUND;
END;
$function$;

-- Create an improved slug generation function that handles special characters and ensures uniqueness
CREATE OR REPLACE FUNCTION public.generate_unique_talent_slug(p_name text, p_exclude_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Generate base slug: normalize special characters, lowercase, replace spaces with hyphens
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(p_name, '[ñÑ]', 'n', 'g'),
        '[áàäâÁÀÄÂ]', 'a', 'g'
      ),
      '[éèëêÉÈËÊ]', 'e', 'g'
    )
  );
  base_slug := lower(regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (
    SELECT 1 FROM talent_profiles 
    WHERE slug = final_slug 
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;