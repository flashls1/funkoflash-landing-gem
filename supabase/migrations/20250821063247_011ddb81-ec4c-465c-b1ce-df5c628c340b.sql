-- Fix infinite recursion in talent_profiles RLS policies
-- First drop existing function and recreate

DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create security definer function to avoid circular references
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT role FROM profiles WHERE user_id = p_user_id;
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Talent can view their own and other active profiles" ON talent_profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic talent profiles" ON talent_profiles;
DROP POLICY IF EXISTS "Business users can view assigned talent profiles" ON talent_profiles;

-- Recreate policies without recursion
CREATE POLICY "Authenticated users can view active talent profiles"
ON talent_profiles FOR SELECT
USING (
  auth.role() = 'authenticated' AND active = true
);

CREATE POLICY "Business users can view assigned talent profiles"
ON talent_profiles FOR SELECT
USING (
  get_user_role(auth.uid()) = 'business' AND 
  active = true AND 
  EXISTS (
    SELECT 1 FROM business_talent_access bta
    WHERE bta.talent_id = talent_profiles.id
  )
);

CREATE POLICY "Talent can view and edit their own profile"
ON talent_profiles FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());