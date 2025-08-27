-- Fix security warning: Set search path for the validation function
CREATE OR REPLACE FUNCTION validate_calendar_event_creation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;