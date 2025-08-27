-- Step 1: Clean up phantom data
-- Delete the phantom "Anime Dubbing Session" event
DELETE FROM calendar_event 
WHERE id = 'aa28b5a8-d0fc-4fdf-afc3-0e4b5ff63277';

-- Delete Jesse's duplicate talent profile (business users shouldn't have talent profiles)
DELETE FROM talent_profiles 
WHERE id = '65144dbc-c38a-450e-83a8-489f692c79e6';

-- Step 2: Create/update business account for Jesse
INSERT INTO business_account (name, contact_email, contact_phone, city, state, country)
VALUES ('Collectors Collision', 'dsocial@live.com', NULL, NULL, NULL, 'USA')
ON CONFLICT (contact_email) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- Step 3: Connect Jesse's business account to the COLLECTORS COLLISION business event
INSERT INTO business_event_account (event_id, business_account_id)
SELECT 
  be.id as event_id,
  ba.id as business_account_id
FROM business_events be
CROSS JOIN business_account ba
WHERE be.title = 'COLLECTORS COLLISION'
  AND ba.contact_email = 'dsocial@live.com'
ON CONFLICT (event_id, business_account_id) DO NOTHING;

-- Step 4: Update calendar events to use proper business account names
UPDATE calendar_event 
SET event_title = REPLACE(event_title, 'Display Name', ba.name)
FROM business_account ba, business_events be
WHERE calendar_event.source_row_id = be.id::text
  AND EXISTS (
    SELECT 1 FROM business_event_account bea 
    WHERE bea.event_id = be.id AND bea.business_account_id = ba.id
  )
  AND calendar_event.event_title LIKE '%Display Name%';