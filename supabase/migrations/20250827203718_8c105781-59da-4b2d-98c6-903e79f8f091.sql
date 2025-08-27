-- Step 1: Clean up phantom data
-- Delete the phantom "Anime Dubbing Session" event
DELETE FROM calendar_event 
WHERE id = 'aa28b5a8-d0fc-4fdf-afc3-0e4b5ff63277';

-- Delete Jesse's duplicate talent profile (business users shouldn't have talent profiles)
DELETE FROM talent_profiles 
WHERE id = '65144dbc-c38a-450e-83a8-489f692c79e6';

-- Step 2: Connect Jesse's existing business account to the COLLECTORS COLLISION business event
-- (The business account already exists with id 26bf6937-6214-402e-9f48-82f2e8e4cf27)
INSERT INTO business_event_account (event_id, business_account_id)
SELECT 
  'd01f648f-ca94-47df-9847-cebe0def9d76'::uuid as event_id,
  '26bf6937-6214-402e-9f48-82f2e8e4cf27'::uuid as business_account_id
WHERE NOT EXISTS (
  SELECT 1 FROM business_event_account 
  WHERE event_id = 'd01f648f-ca94-47df-9847-cebe0def9d76'::uuid 
    AND business_account_id = '26bf6937-6214-402e-9f48-82f2e8e4cf27'::uuid
);

-- Step 3: Update calendar events to use proper business account names instead of "Display Name"
UPDATE calendar_event 
SET event_title = 'COLLECTORS COLLISION'
WHERE source_row_id = 'd01f648f-ca94-47df-9847-cebe0def9d76'
  AND event_title LIKE '%Display Name%';