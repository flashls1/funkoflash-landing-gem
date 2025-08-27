-- STRICT EVENT CREATION CONTROLS: Delete phantom events and implement safeguards

-- Step 1: Delete all phantom/unauthorized calendar events
-- These are events with no legitimate business event source or admin/staff creator
DELETE FROM calendar_event 
WHERE created_by IS NULL 
   OR source_row_id IS NULL 
   OR event_title IN ('Convention Panel', 'Voice Acting Workshop', 'Fan Meet & Greet', 'Character Recording')
   OR NOT EXISTS (
     SELECT 1 FROM profiles p 
     WHERE p.user_id = calendar_event.created_by 
     AND p.role IN ('admin', 'staff')
   );

-- Step 2: Create validation function for calendar event creation
CREATE OR REPLACE FUNCTION validate_calendar_event_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure created_by is set and is admin/staff
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'Calendar events must have a valid creator (created_by cannot be null)';
  END IF;
  
  -- Check if creator has admin or staff role
  IF NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = NEW.created_by 
    AND p.role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'Only admin and staff users can create calendar events';
  END IF;
  
  -- For business event sourced events, ensure source_row_id exists and is valid
  IF NEW.source_row_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM business_events be 
      WHERE be.id::text = NEW.source_row_id
    ) THEN
      RAISE EXCEPTION 'Invalid source_row_id: business event does not exist';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to enforce validation on INSERT and UPDATE
DROP TRIGGER IF EXISTS validate_calendar_event_trigger ON calendar_event;
CREATE TRIGGER validate_calendar_event_trigger
  BEFORE INSERT OR UPDATE ON calendar_event
  FOR EACH ROW
  EXECUTE FUNCTION validate_calendar_event_creation();

-- Step 4: Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Business users can create calendar events for their events" ON calendar_event;
DROP POLICY IF EXISTS "Business users can view calendar events for their events" ON calendar_event;
DROP POLICY IF EXISTS "Business users can view calendar events from their business eve" ON calendar_event;
DROP POLICY IF EXISTS "Business users can view their own calendar events" ON calendar_event;

-- Only admin/staff can create calendar events
CREATE POLICY "Only admin/staff can create calendar events"
ON calendar_event FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'staff')
  )
);

-- Business users can view calendar events from their assigned business events
CREATE POLICY "Business users can view their business event calendar entries"
ON calendar_event FOR SELECT
USING (
  source_row_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    JOIN profiles p ON p.email = ba.contact_email
    WHERE bea.event_id::text = calendar_event.source_row_id
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);

-- Talent can view calendar events they're assigned to
CREATE POLICY "Talent can view their assigned calendar events"
ON calendar_event FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp
    WHERE tp.id = calendar_event.talent_id
    AND tp.user_id = auth.uid()
  )
);

-- Step 5: Add NOT NULL constraint to created_by to prevent future null creators
ALTER TABLE calendar_event ALTER COLUMN created_by SET NOT NULL;

-- Step 6: Data integrity check - Log any remaining questionable events
INSERT INTO security_audit_log (user_id, action, table_name, new_values)
SELECT 
  auth.uid(),
  'data_integrity_check',
  'calendar_event',
  jsonb_build_object(
    'questionable_events_count', COUNT(*),
    'check_timestamp', now(),
    'note', 'Remaining calendar events after phantom cleanup'
  )
FROM calendar_event
WHERE created_by IS NOT NULL;