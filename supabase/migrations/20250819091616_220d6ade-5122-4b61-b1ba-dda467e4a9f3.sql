-- Fix the security definer view warning by removing SECURITY DEFINER from view
-- Views with SECURITY DEFINER can be problematic, so let's remove the view and use the function instead
DROP VIEW IF EXISTS public.user_directory;

-- Fix the function search path issue
CREATE OR REPLACE FUNCTION public.get_users_for_messaging()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  role app_role
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.first_name, p.email) as display_name,
    p.role
  FROM public.profiles p
  WHERE p.active = true
  AND p.user_id != auth.uid(); -- Exclude current user
$$;

-- Remove the redundant RLS policy that was too permissive
DROP POLICY IF EXISTS "Authenticated users can view user directory" ON public.profiles;
DROP POLICY IF EXISTS "Users can view minimal profile info for messaging" ON public.profiles;