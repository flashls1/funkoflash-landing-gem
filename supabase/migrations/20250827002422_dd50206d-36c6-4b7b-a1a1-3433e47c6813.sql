-- Add RLS policies for business users to access their events and related data

-- Allow business users to view their assigned events through business_event_account
CREATE POLICY "Business users can view their assigned events" 
ON business_event_account 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM business_account ba
    JOIN profiles p ON p.email = ba.contact_email
    WHERE ba.id = business_event_account.business_account_id 
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);

-- Allow business users to view talent assignments for their events
CREATE POLICY "Business users can view talent for their events" 
ON business_event_talent 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    JOIN profiles p ON p.email = ba.contact_email
    WHERE bea.event_id = business_event_talent.event_id 
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);

-- Allow business users to view calendar events for their business events
CREATE POLICY "Business users can view calendar events for their events" 
ON calendar_event 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM business_events be
    JOIN business_event_account bea ON bea.event_id = be.id
    JOIN business_account ba ON ba.id = bea.business_account_id
    JOIN profiles p ON p.email = ba.contact_email
    WHERE be.title = calendar_event.event_title
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);

-- Allow business users to create calendar events for their business events
CREATE POLICY "Business users can create calendar events for their events" 
ON calendar_event 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_events be
    JOIN business_event_account bea ON bea.event_id = be.id
    JOIN business_account ba ON ba.id = bea.business_account_id
    JOIN profiles p ON p.email = ba.contact_email
    WHERE be.title = calendar_event.event_title
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);