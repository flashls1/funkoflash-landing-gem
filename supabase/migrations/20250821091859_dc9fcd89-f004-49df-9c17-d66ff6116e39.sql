-- Create a function to handle admin-created talent profiles that don't require user accounts initially
CREATE OR REPLACE FUNCTION public.create_admin_talent_profile(
  p_name TEXT,
  p_slug TEXT,
  p_bio TEXT DEFAULT NULL,
  p_headshot_url TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT TRUE,
  p_sort_rank INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id UUID;
  v_temp_user_id UUID;
BEGIN
  -- Only allow admin/staff to create talent profiles
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to create talent profiles';
  END IF;
  
  -- Generate a temporary UUID for the user_id (will be replaced when linked to real user)
  v_temp_user_id := gen_random_uuid();
  v_talent_id := gen_random_uuid();
  
  -- Insert the talent profile with temporary user_id
  INSERT INTO talent_profiles (
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
    v_temp_user_id,
    p_name,
    p_slug,
    p_bio,
    p_headshot_url,
    p_active,
    false, -- Default to private until manually made public
    p_sort_rank
  );
  
  RETURN v_talent_id;
END;
$$;