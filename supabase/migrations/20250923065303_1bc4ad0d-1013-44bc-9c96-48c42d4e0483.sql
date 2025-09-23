-- Complete schema improvements and fixes

-- PHASE 6: Ensure proper RLS on talent_profiles vs talent_quick_view separation
DROP POLICY IF EXISTS "talent_profiles_public_view" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_admin_staff_manage" ON talent_profiles;

CREATE POLICY "talent_profiles_public_view" 
ON talent_profiles 
FOR SELECT 
USING (active = true AND public_visibility = true);

CREATE POLICY "talent_profiles_admin_staff_manage" 
ON talent_profiles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- PHASE 7: Ensure consistent foreign key naming
-- Check and add missing constraints where needed
ALTER TABLE business_event_talent 
DROP CONSTRAINT IF EXISTS business_event_talent_event_id_fkey,
ADD CONSTRAINT fk_business_event_talent_event 
FOREIGN KEY (event_id) REFERENCES business_events(id) ON DELETE CASCADE,
DROP CONSTRAINT IF EXISTS business_event_talent_talent_id_fkey,
ADD CONSTRAINT fk_business_event_talent_talent 
FOREIGN KEY (talent_id) REFERENCES talent_profiles(id) ON DELETE CASCADE;

ALTER TABLE calendar_event 
DROP CONSTRAINT IF EXISTS calendar_event_talent_id_fkey,
ADD CONSTRAINT fk_calendar_event_talent 
FOREIGN KEY (talent_id) REFERENCES talent_profiles(id) ON DELETE SET NULL,
DROP CONSTRAINT IF EXISTS calendar_event_business_event_id_fkey,
ADD CONSTRAINT fk_calendar_event_business_event 
FOREIGN KEY (business_event_id) REFERENCES business_events(id) ON DELETE SET NULL;

-- PHASE 8: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_talent_quick_view_talent_profile_id ON talent_quick_view(talent_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_event_talent_event_id ON business_event_talent(event_id);
CREATE INDEX IF NOT EXISTS idx_business_event_talent_talent_id ON business_event_talent(talent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_talent_id ON calendar_event(talent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_business_event_id ON calendar_event(business_event_id);

-- PHASE 9: Add helpful comments for documentation
COMMENT ON TABLE talent_profiles IS 'Public-facing talent directory information (bio, headshot, social media)';
COMMENT ON TABLE talent_quick_view IS 'Admin/Staff-only sensitive talent data (DOB, passport, visa, travel info)';
COMMENT ON TABLE public_events IS 'Fan-facing public events displayed on the website';
COMMENT ON TABLE business_events IS 'Internal business events for talent management and logistics';