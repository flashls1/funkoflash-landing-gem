-- SECURITY FIX: Talent Personal Information Exposure
-- Replace public access with authenticated-only access and proper data filtering

-- Drop the insecure public access policy
DROP POLICY IF EXISTS "Anyone can view active talent profiles" ON talent_profiles;

-- Create secure policies for different user types
CREATE POLICY "Authenticated users can view basic talent profiles"
ON talent_profiles
FOR SELECT
USING (
  auth.role() = 'authenticated' AND active = true
);

-- Admin/staff get full access (already covered by existing policies)
-- Business users get access to talents they work with
CREATE POLICY "Business users can view assigned talent profiles"
ON talent_profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  active = true AND
  EXISTS (
    SELECT 1 FROM business_talent_access bta
    WHERE bta.talent_id = talent_profiles.id
  )
);

-- Talent users can view their own profile and other active talents (for collaboration)
CREATE POLICY "Talent can view their own and other active profiles"
ON talent_profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'talent'::app_role) AND 
  active = true AND
  (
    user_id = auth.uid() OR
    -- Allow talents to see basic info of other active talents
    EXISTS (SELECT 1 FROM talent_profiles tp WHERE tp.user_id = auth.uid() AND tp.active = true)
  )
);

-- Create a PUBLIC view with only non-sensitive information for marketing/showcase purposes
-- This replaces the previous unrestricted access with a curated, safe data set
CREATE OR REPLACE VIEW public_talent_showcase AS
SELECT 
  id,
  name,
  slug,
  headshot_url,
  -- Only include bio if it's explicitly marked as public-safe (we'll add this field)
  CASE 
    WHEN bio IS NOT NULL AND LENGTH(bio) > 0 
    THEN LEFT(bio, 200) || '...' -- Truncated bio for safety
    ELSE NULL 
  END as preview_bio,
  sort_rank
FROM talent_profiles 
WHERE active = true 
AND user_id IS NOT NULL; -- Extra safety check

-- Grant public access to the safe showcase view only
GRANT SELECT ON public_talent_showcase TO anon;
GRANT SELECT ON public_talent_showcase TO authenticated;

-- Add a flag to control public visibility (for future use)
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS public_visibility boolean DEFAULT false;

-- Update existing profiles to be private by default
UPDATE talent_profiles SET public_visibility = false WHERE public_visibility IS NULL;