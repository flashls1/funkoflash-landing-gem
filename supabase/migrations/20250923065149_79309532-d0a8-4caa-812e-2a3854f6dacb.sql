-- PHASE 1: Rename events to public_events for clarity
ALTER TABLE events RENAME TO public_events;

-- PHASE 2: Consolidate talent assignments - Keep only business_event_talent
-- First, migrate any important data from other assignment tables
INSERT INTO business_event_talent (event_id, talent_id)
SELECT DISTINCT 
  eta.event_id,
  eta.talent_id
FROM event_talent_assignments eta
WHERE NOT EXISTS (
  SELECT 1 FROM business_event_talent bet 
  WHERE bet.event_id = eta.event_id AND bet.talent_id = eta.talent_id
);

INSERT INTO business_event_talent (event_id, talent_id)
SELECT DISTINCT 
  te.event_id,
  te.talent_id
FROM talent_event te
WHERE NOT EXISTS (
  SELECT 1 FROM business_event_talent bet 
  WHERE bet.event_id = te.event_id AND bet.talent_id = te.talent_id
);

-- Drop the redundant assignment tables
DROP TABLE IF EXISTS event_talent_assignments CASCADE;
DROP TABLE IF EXISTS talent_event CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;

-- PHASE 3: Add talent_profile_id column to talent_quick_view first
ALTER TABLE talent_quick_view 
ADD COLUMN talent_profile_id uuid;

-- Add foreign key constraint
ALTER TABLE talent_quick_view 
ADD CONSTRAINT fk_talent_quick_view_talent_profile 
FOREIGN KEY (talent_profile_id) REFERENCES talent_profiles(id) ON DELETE CASCADE;

-- PHASE 4: Standardize naming - ensure all tables have proper timestamps
ALTER TABLE talent_quick_view 
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS updated_by uuid;

-- PHASE 5: Tighten RLS policies for talent_quick_view
DROP POLICY IF EXISTS "talent_quick_view_admin_staff_only" ON talent_quick_view;

CREATE POLICY "talent_quick_view_admin_staff_only" 
ON talent_quick_view 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));