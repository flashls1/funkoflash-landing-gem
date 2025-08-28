-- Enable RLS on the view itself
ALTER VIEW public.v_business_calendar_events OWNER TO postgres;

-- Since views can't have RLS policies directly, we need to ensure the underlying tables 
-- properly enforce security. Let me update the business_events policy to be more restrictive.

-- First, update business_events RLS policy to use profiles.id instead of user_id
drop policy if exists business_events_select on public.business_events;
create policy business_events_select on public.business_events
for select to authenticated
using (
  -- Only allow if user is admin/staff
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'staff'::app_role) OR
  -- Or if the event is linked to user's business via the corrected BAU relationship  
  exists (
    select 1 from public.business_event_account bea
    join public.business_account_user bau on bau.business_account_id = bea.business_account_id
    join public.profiles p on p.id = bau.user_id  -- Use profiles.id not user_id
    where bea.event_id = business_events.id
      and p.user_id = auth.uid()  -- Match against the actual auth user_id
  )
);