-- Add missing admin policies for tables with RLS but no policies
create policy bookings_admin_manage on public.bookings
for all to authenticated
using (is_admin(auth.uid()));

create policy business_account_admin_manage on public.business_account
for all to authenticated
using (is_admin(auth.uid()));

create policy calendar_event_admin_manage on public.calendar_event
for all to authenticated
using (is_admin(auth.uid()));

-- Re-create views without security_barrier (which was causing security definer warnings)
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
  bea.business_account_id
from public.business_events be
join public.business_event_account bea on bea.event_id = be.id;

grant select on public.v_business_calendar_events to authenticated;

-- Re-create talent view without security_barrier
drop view if exists public.v_talent_calendar_events;
create view public.v_talent_calendar_events as
select
  e.id    as event_id,
  e.title,
  e.status,
  e.start_ts as start_at,
  e.end_ts   as end_at,
  ep.talent_id
from public.business_events e
join public.event_participants ep on ep.event_id = e.id;

grant select on public.v_talent_calendar_events to authenticated;