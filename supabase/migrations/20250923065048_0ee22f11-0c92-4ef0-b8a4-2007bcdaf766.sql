-- PHASE 1: Rename events to public_events for clarity
ALTER TABLE events RENAME TO public_events;

-- Update any references in calendar_event if needed
UPDATE calendar_event 
SET business_event_id = NULL 
WHERE business_event_id IN (
  SELECT id FROM public_events
);

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

-- PHASE 3: Add missing foreign key from talent_quick_view to talent_profiles
ALTER TABLE talent_quick_view 
ADD CONSTRAINT fk_talent_quick_view_talent_profile 
FOREIGN KEY (talent_profile_id) REFERENCES talent_profiles(id) ON DELETE CASCADE;