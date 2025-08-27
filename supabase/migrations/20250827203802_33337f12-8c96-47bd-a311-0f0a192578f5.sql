-- Step 4: Fix RLS policies for real-time assignment visibility

-- Drop and recreate business_event_account policies for better real-time access
DROP POLICY IF EXISTS "Business users can view their assigned events" ON business_event_account;
DROP POLICY IF EXISTS "Business users can view their event assignments" ON business_event_account;

-- Create comprehensive policy for business users to see their event assignments immediately
CREATE POLICY "Business users can view their business event assignments"
ON business_event_account FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_account ba
    JOIN profiles p ON p.email = ba.contact_email
    WHERE ba.id = business_event_account.business_account_id
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);

-- Update business_events policies for immediate visibility after assignment
DROP POLICY IF EXISTS "Business users can view their assigned events" ON business_events;

CREATE POLICY "Business users can view assigned business events"
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

-- Allow business users to update their assigned events
CREATE POLICY "Business users can update assigned business events"
ON business_events FOR UPDATE
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