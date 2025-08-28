-- Link COLLECTORS COLLISION event to Jesse's business (without assigned_order)
insert into public.business_event_account (event_id, business_account_id)
values ('d01f648f-ca94-47df-9847-cebe0def9d76'::uuid, '26bf6937-6214-402e-9f48-82f2e8e4cf27'::uuid)
on conflict (event_id, business_account_id) do nothing;