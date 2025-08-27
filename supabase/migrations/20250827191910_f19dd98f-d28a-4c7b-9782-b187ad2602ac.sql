-- Add RLS policy to allow business users to read calendar events created for them
CREATE POLICY "Business users can view their own calendar events" 
ON calendar_event 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = calendar_event.talent_id 
      AND tp.user_id = auth.uid()
  )
);