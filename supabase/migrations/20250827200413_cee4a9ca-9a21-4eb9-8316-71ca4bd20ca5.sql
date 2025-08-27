-- Drop the overly broad calendar_event policy that's showing talent events to business users
DROP POLICY IF EXISTS "Business users can view calendar events from their assigned business events" ON calendar_event;

-- Create a more precise policy: business users can only see calendar events created from their assigned business events
CREATE POLICY "Business users can view calendar events from their business events"
ON calendar_event FOR SELECT
USING (
  -- Only calendar events that were created from business events (have source_row_id)
  source_row_id IS NOT NULL
  AND
  -- And the business event is assigned to this user's business account
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id  
    JOIN profiles p ON p.email = ba.contact_email
    WHERE bea.event_id::text = calendar_event.source_row_id
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);

-- Also fix the business_events policy to be more precise
DROP POLICY IF EXISTS "Business members can manage their events" ON business_events;

CREATE POLICY "Business users can view their assigned events"
ON business_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    JOIN profiles p ON p.email = ba.contact_email  
    WHERE bea.event_id = business_events.id
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);