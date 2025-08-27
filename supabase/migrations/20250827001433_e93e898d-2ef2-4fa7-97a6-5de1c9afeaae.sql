-- Add RLS policy for talent users to view their own business event assignments
CREATE POLICY "Talent can view their own assignments" 
ON business_event_talent 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = business_event_talent.talent_id 
    AND tp.user_id = auth.uid()
  )
);