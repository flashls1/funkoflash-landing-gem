-- Fix security definer view issues by dropping problematic public views
-- These views bypass RLS and create security vulnerabilities

-- Drop the public views that are causing security definer issues
DROP VIEW IF EXISTS public.public_talent_showcase;
DROP VIEW IF EXISTS public.public_profiles;

-- Instead, we'll rely on the existing RLS policies on the base tables
-- Users can query talent_profiles and profiles directly with proper RLS enforcement

-- For public talent showcase functionality, we can create a secure function instead
CREATE OR REPLACE FUNCTION public.get_public_talent_showcase()
RETURNS TABLE(
  id uuid,
  name varchar,
  slug varchar,
  headshot_url text,
  preview_bio text,
  sort_rank integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- This ensures it runs with caller's permissions, not definer's
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
    AND tp.user_id IS NOT NULL;
$$;

-- For public profiles, create a secure function as well
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  role app_role,
  active boolean,
  status text,
  name_color text,
  background_image_url text,
  business_name text
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- This ensures it runs with caller's permissions, not definer's
SET search_path TO 'public'
AS $$
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
  FROM profiles p
  WHERE p.active = true;
$$;