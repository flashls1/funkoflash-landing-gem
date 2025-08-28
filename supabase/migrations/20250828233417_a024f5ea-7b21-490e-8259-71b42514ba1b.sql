-- Fix the calendar event validation trigger to handle deletions properly
-- The issue is that the trigger fires during calendar event deletions when the business event is being deleted

-- Update the validation function to only run on INSERT and UPDATE, not DELETE
DROP TRIGGER IF EXISTS trigger_validate_calendar_event_creation ON public.calendar_event;

-- Re-create the trigger to only fire on INSERT and UPDATE
CREATE TRIGGER trigger_validate_calendar_event_creation
  BEFORE INSERT OR UPDATE ON public.calendar_event
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_calendar_event_creation();