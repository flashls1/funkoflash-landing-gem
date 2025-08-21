-- Phase 1: Database Structure Cleanup for Talent Directory Management

-- 1. Drop existing foreign key constraint on talent_profiles.user_id if it exists
ALTER TABLE public.talent_profiles DROP CONSTRAINT IF EXISTS talent_profiles_user_id_fkey;

-- 2. Make user_id nullable and remove dependency on auth.users
ALTER TABLE public.talent_profiles ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add public_visibility column for controlling public directory display
ALTER TABLE public.talent_profiles ADD COLUMN IF NOT EXISTS public_visibility boolean DEFAULT false;

-- 4. Update RLS policies to be admin/staff only without user checks
DROP POLICY IF EXISTS "Admins can manage all talent profiles" ON public.talent_profiles;
DROP POLICY IF EXISTS "Staff can manage all talent profiles" ON public.talent_profiles;
DROP POLICY IF EXISTS "Talent can view and edit their own profile" ON public.talent_profiles;
DROP POLICY IF EXISTS "Authenticated users can view active talent profiles" ON public.talent_profiles;
DROP POLICY IF EXISTS "Business users can view assigned talent profiles" ON public.talent_profiles;

CREATE POLICY "Admins can manage all talent profiles" 
ON public.talent_profiles FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all talent profiles" 
ON public.talent_profiles FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Anyone can view active public talent profiles" 
ON public.talent_profiles FOR SELECT 
USING (active = true AND public_visibility = true);

-- 5. Update the create_admin_talent_profile function to not require user_id
DROP FUNCTION IF EXISTS public.create_admin_talent_profile(text, text, text, text, boolean, integer);

CREATE OR REPLACE FUNCTION public.create_admin_talent_profile(
  p_name text,
  p_slug text,
  p_bio text DEFAULT NULL,
  p_headshot_url text DEFAULT NULL,
  p_active boolean DEFAULT true,
  p_sort_rank integer DEFAULT 0,
  p_public_visibility boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_talent_id UUID;
BEGIN
  -- Only allow admin/staff to create talent profiles
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to create talent profiles';
  END IF;
  
  v_talent_id := gen_random_uuid();
  
  -- Insert the talent profile without user_id dependency
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
$$;

-- 6. Make talent-headshots storage bucket public
UPDATE storage.buckets SET public = true WHERE id = 'talent-headshots';

-- 7. Update storage policies for public access to talent headshots
DROP POLICY IF EXISTS "Anyone can view talent headshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage talent headshots" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage talent headshots" ON storage.objects;

CREATE POLICY "Anyone can view talent headshots" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'talent-headshots');

CREATE POLICY "Admins can manage talent headshots" 
ON storage.objects FOR ALL 
USING (bucket_id = 'talent-headshots' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage talent headshots" 
ON storage.objects FOR ALL 
USING (bucket_id = 'talent-headshots' AND has_role(auth.uid(), 'staff'::app_role));

-- 8. Update get_public_talent_showcase function to use public_visibility
CREATE OR REPLACE FUNCTION public.get_public_talent_showcase()
RETURNS TABLE(id uuid, name character varying, slug character varying, headshot_url text, preview_bio text, sort_rank integer)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
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
    tp.sort_rank
  FROM talent_profiles tp
  WHERE tp.active = true 
    AND tp.public_visibility = true
  ORDER BY tp.sort_rank ASC;
$$;