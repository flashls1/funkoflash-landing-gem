-- Fix Jesse's BAU relationship using profiles.id (not user_id)
insert into public.business_account_user (business_account_id, user_id, role)
values ('26bf6937-6214-402e-9f48-82f2e8e4cf27'::uuid, '53f053c4-e208-44d0-afda-a394fc807312'::uuid, 'member')
on conflict (business_account_id, user_id) do nothing;

-- Link COLLECTORS COLLISION event to Jesse's business (without assigned_order)
insert into public.business_event_account (event_id, business_account_id)
values ('d01f648f-ca94-47df-9847-cebe0def9d76'::uuid, '26bf6937-6214-402e-9f48-82f2e8e4cf27'::uuid)
on conflict (event_id, business_account_id) do nothing;