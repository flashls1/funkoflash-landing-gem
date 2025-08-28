-- Enable RLS
alter table public.business_events enable row level security;
alter table public.business_event_account enable row level security;
alter table public.business_account_user enable row level security;

-- Drop ALL existing policies on these tables to ensure clean slate
do $$
declare
    pol record;
begin
    for pol in 
        select schemaname, tablename, policyname 
        from pg_policies 
        where schemaname = 'public' 
        and tablename in ('business_events', 'business_event_account', 'business_account_user', 'business_account', 'bookings', 'calendar_event')
    loop
        execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    end loop;
end $$;

-- Tight policies (BAU/BEA only)
create policy bea_select on public.business_event_account
for select to authenticated
using (
  exists (
    select 1 from public.business_account_user bau
    where bau.business_account_id = business_event_account.business_account_id
      and bau.user_id = auth.uid()
  )
);

create policy bau_select on public.business_account_user
for select to authenticated
using (business_account_user.user_id = auth.uid());

create policy business_events_select on public.business_events
for select to authenticated
using (
  exists (
    select 1 from public.business_event_account bea
    join public.business_account_user bau on bau.business_account_id = bea.business_account_id
    where bea.event_id = business_events.id
      and bau.user_id = auth.uid()
  )
);

-- Canonical view used by the Business dashboard
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

alter view public.v_business_calendar_events set (security_barrier = true);
grant select on public.v_business_calendar_events to authenticated;

-- Optional: keep talent view if used elsewhere
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
alter view public.v_talent_calendar_events set (security_barrier = true);
grant select on public.v_talent_calendar_events to authenticated;

-- Validator function (deterministic, email input)
create or replace function public.debug_business_visibility(p_user_email text)
returns table (
  test text,
  ok boolean,
  user_id uuid,
  should_events int,
  visible_event_titles text[],
  missing_links text[]
) language plpgsql security definer set search_path=public as $$
declare v_user uuid; v_should int; v_titles text[]; miss text[];
begin
  select user_id into v_user from public.profiles where lower(email)=lower(p_user_email);
  if v_user is null then
    return query select 'user_exists', false, null::uuid, 0, array[]::text[], array['no profile'];
    return;
  end if;

  -- events the user SHOULD see (based on BAU/BEA graph)
  select count(distinct be.id) into v_should
  from public.business_events be
  join public.business_event_account bea on bea.event_id = be.id
  join public.business_account_user bau on bau.business_account_id = bea.business_account_id
  where bau.user_id = v_user;

  -- Titles visible through the same graph (sanity mirror)
  select coalesce(array_agg(t.title order by t.title), array[]::text[])
    into v_titles
  from (
    select distinct be.title
    from public.business_events be
    join public.business_event_account bea on bea.event_id = be.id
    join public.business_account_user bau on bau.business_account_id = bea.business_account_id
    where bau.user_id = v_user
  ) t;

  miss := array[]::text[];
  if not exists (select 1 from public.business_account_user where user_id=v_user) then
    miss := miss || 'NO BAU row for this user';
  end if;
  if not exists (
    select 1 from public.business_event_account bea
    join public.business_account_user bau on bau.business_account_id=bea.business_account_id
    where bau.user_id=v_user
  ) then
    miss := miss || 'NO BEA row for any event linked to user business';
  end if;

  return query select 'visibility_graph', (v_should = cardinality(v_titles)), v_user, v_should, v_titles, miss;
end $$;