-- Fix RLS policies for business users to access their assigned events

-- 1. Add RLS policy for business users to view calendar events from their assigned business events
CREATE POLICY "Business users can view calendar events from their assigned business events"
ON public.calendar_event 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.business_event_account bea
    JOIN public.business_account ba ON ba.id = bea.business_account_id  
    JOIN public.profiles p ON p.email = ba.contact_email
    WHERE bea.event_id::text = calendar_event.source_row_id
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);

-- 2. Add RLS policy for business users to view their event assignments in business_event_account
CREATE POLICY "Business users can view their event assignments"
ON public.business_event_account 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.business_account ba
    JOIN public.profiles p ON p.email = ba.contact_email
    WHERE ba.id = business_event_account.business_account_id
    AND p.user_id = auth.uid()
    AND p.role = 'business'::app_role
  )
);

-- 3. Update the existing business_events RLS policy to properly verify business account ownership
DROP POLICY IF EXISTS "Business members can manage their events" ON public.business_events;

CREATE POLICY "Business users can manage their assigned events"
ON public.business_events
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 
    FROM public.business_event_account bea
    JOIN public.business_account ba ON ba.id = bea.business_account_id
    JOIN public.profiles p ON p.email = ba.contact_email  
    WHERE bea.event_id = business_events.id
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 
    FROM public.business_event_account bea
    JOIN public.business_account ba ON ba.id = bea.business_account_id
    JOIN public.profiles p ON p.email = ba.contact_email  
    WHERE bea.event_id = business_events.id
    AND p.user_id = auth.uid()
  )
);