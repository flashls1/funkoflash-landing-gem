-- Check and fix all potential issues with business event deletion
-- The error suggests the calendar event validation is still running during deletion

-- First, let's make sure no triggers exist that could interfere
DROP TRIGGER IF EXISTS trigger_validate_calendar_event_creation ON public.calendar_event;

-- Check if there are any other triggers or functions that might reference business events
-- Let's update the validation function to handle the case where business event is being deleted

CREATE OR REPLACE FUNCTION public.validate_calendar_event_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate on INSERT and UPDATE, not DELETE
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

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
  -- But only if we're not in the middle of deleting the business event
  IF NEW.source_row_id IS NOT NULL AND NEW.source_file = 'business_event' THEN
    -- Only check if business event exists during INSERT/UPDATE, not during deletion cascade
    IF NOT EXISTS (
      SELECT 1 FROM business_events be 
      WHERE be.id::text = NEW.source_row_id
    ) THEN
      -- Allow the operation to proceed if this is part of a deletion cascade
      -- by checking if we're in a transaction that's deleting business events
      RAISE EXCEPTION 'Invalid source_row_id: business event does not exist';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Recreate the trigger to only fire on INSERT and UPDATE
CREATE TRIGGER trigger_validate_calendar_event_creation
  BEFORE INSERT OR UPDATE ON public.calendar_event
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_calendar_event_creation();