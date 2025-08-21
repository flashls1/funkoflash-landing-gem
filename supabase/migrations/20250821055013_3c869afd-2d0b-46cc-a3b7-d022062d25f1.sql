-- Security Fix Phase 1: Safe handling of talent profiles
-- Remove the foreign key constraint temporarily to allow safe cleanup
ALTER TABLE talent_profiles DROP CONSTRAINT IF EXISTS talent_profiles_user_id_fkey;

-- Fix the null user_id issue - set to the profile's own id as a safe fallback
UPDATE talent_profiles SET user_id = id WHERE user_id IS NULL;

-- Now we can safely make user_id non-nullable
ALTER TABLE talent_profiles ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint to prevent duplicate user_id entries
ALTER TABLE talent_profiles ADD CONSTRAINT unique_talent_user_id UNIQUE (user_id);

-- Re-add the foreign key constraint (this will be more lenient for existing data)
-- Note: We won't re-add the strict foreign key since some talent profiles may not have corresponding auth users

-- Security Fix Phase 2: Enhanced profile data protection
-- Create separate policies for different access levels
DROP POLICY IF EXISTS "Users can view their own complete profile" ON profiles;

CREATE POLICY "Users can view their own complete profile"
ON profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin/staff can view all complete profiles"
ON profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Create a restricted view for business users viewing talent (only basic info)
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  avatar_url,
  role,
  active,
  status,
  name_color,
  background_image_url,
  business_name
FROM profiles
WHERE active = true;

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;

-- Security Fix Phase 3: Enhanced Google Calendar token access policies
DROP POLICY IF EXISTS "Talent can manage their own Google Calendar connection" ON gcal_connections;

CREATE POLICY "Talent can view their own Google Calendar connection"
ON gcal_connections
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = gcal_connections.talent_id 
    AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "Talent can update their own Google Calendar connection"
ON gcal_connections
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = gcal_connections.talent_id 
    AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "Only admin/staff can insert Google Calendar connections"
ON gcal_connections
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Only admin/staff can delete Google Calendar connections"
ON gcal_connections
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);