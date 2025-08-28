-- Fix Jesse's BAU relationship with direct UUID
insert into public.business_account_user (business_account_id, user_id, role)
values ('26bf6937-6214-402e-9f48-82f2e8e4cf27'::uuid, 'c08a6d1a-13b5-44d6-84af-ef7b90072a31'::uuid, 'member')
on conflict (business_account_id, user_id) do nothing;

-- Link COLLECTORS COLLISION event to Jesse's business
insert into public.business_event_account (event_id, business_account_id, assigned_order)
values ('d01f648f-ca94-47df-9847-cebe0def9d76'::uuid, '26bf6937-6214-402e-9f48-82f2e8e4cf27'::uuid, 1)
on conflict (event_id, business_account_id) do nothing;

-- Fix the validator function (column ambiguity bug)
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
  select p.user_id into v_user from public.profiles p where lower(p.email)=lower(p_user_email);
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