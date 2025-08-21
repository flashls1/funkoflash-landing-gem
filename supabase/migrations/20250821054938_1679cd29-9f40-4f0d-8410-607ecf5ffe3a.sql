-- Security Fix Phase 1: Handle orphaned talent profiles first
-- Delete talent profiles that reference non-existent users
DELETE FROM talent_profiles 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM auth.users);

-- Update remaining null user_ids to a safe value (set to profile id as fallback)
UPDATE talent_profiles SET user_id = id WHERE user_id IS NULL;

-- Now we can safely make user_id non-nullable
ALTER TABLE talent_profiles ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint to prevent duplicate user_id entries
ALTER TABLE talent_profiles ADD CONSTRAINT unique_talent_user_id UNIQUE (user_id);

-- Security Fix Phase 2: Enhanced Google Calendar token access policies
-- Keep existing admin/staff access but add more restrictive policies for other users
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