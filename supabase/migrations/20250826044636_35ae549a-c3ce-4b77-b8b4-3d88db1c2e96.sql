-- Delete duplicate business accounts more aggressively
DELETE FROM business_account 
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY contact_email
        ORDER BY created_at DESC
      ) as rn
    FROM business_account
    WHERE contact_email IS NOT NULL
  ) t WHERE rn > 1
);

-- Also clean up by name
DELETE FROM business_account 
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY name
        ORDER BY created_at DESC
      ) as rn
    FROM business_account
    WHERE name IS NOT NULL
    AND id NOT IN (
      SELECT DISTINCT business_account_id 
      FROM business_event_account 
      WHERE business_account_id IS NOT NULL
    )
  ) t WHERE rn > 1
);