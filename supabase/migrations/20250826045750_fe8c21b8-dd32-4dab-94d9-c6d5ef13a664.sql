-- Fix the ANIME FRESNO event linkage to Hoa Tran's business account
-- First, update the primary_business_id for the ANIME FRESNO event
UPDATE business_events 
SET primary_business_id = '32ec0010-d00a-44c5-9d35-3d17db3e81bd'
WHERE title = 'ANIME FRESNO';

-- Then, insert the missing link in business_event_account table
INSERT INTO business_event_account (event_id, business_account_id)
SELECT be.id, '32ec0010-d00a-44c5-9d35-3d17db3e81bd'
FROM business_events be
WHERE be.title = 'ANIME FRESNO'
AND NOT EXISTS (
  SELECT 1 FROM business_event_account bea 
  WHERE bea.event_id = be.id 
  AND bea.business_account_id = '32ec0010-d00a-44c5-9d35-3d17db3e81bd'
);