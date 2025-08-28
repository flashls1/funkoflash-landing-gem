-- Fix the view to handle the profile.id vs user_id pattern correctly
drop view if exists public.v_business_calendar_events;
create view public.v_business_calendar_events as
select
  be.id            as event_id,
  be.title         as title,
  be.status        as status,
  be.start_ts      as start_at,
  be.end_ts        as end_at,
  be.city          as city,
  be.state         as state,
  be.country       as country,
  be.venue         as venue,
  be.updated_at    as updated_at,
  bea.business_account_id,
  p.user_id        as profile_user_id  -- Add this for debugging/filtering
from public.business_events be
join public.business_event_account bea on bea.event_id = be.id
join public.business_account_user bau on bau.business_account_id = bea.business_account_id
join public.profiles p on p.id = bau.user_id;  -- Use profile.id not user_id

grant select on public.v_business_calendar_events to authenticated;