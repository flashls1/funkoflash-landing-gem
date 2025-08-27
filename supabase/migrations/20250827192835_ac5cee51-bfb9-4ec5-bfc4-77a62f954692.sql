-- Update business account names to reflect the actual business users instead of event names
-- This fixes the issue where business accounts were named after events rather than the people/businesses

-- Update Hoa's business account from "Anime Fresno" to "Hoa Tran"
UPDATE business_account 
SET 
  name = 'Hoa Tran',
  updated_at = now()
WHERE id = '32ec0010-d00a-44c5-9d35-3d17db3e81bd'
  AND contact_email = 'kamikazefresno@gmail.com';

-- Update Jesse's business account from "Collectors Collison" to "Jesse"
UPDATE business_account 
SET 
  name = 'Jesse',
  updated_at = now()
WHERE id = '26bf6937-6214-402e-9f48-82f2e8e4cf27'
  AND contact_email = 'dsocial@live.com';

-- Naomi's business account name "Naomi Espinosa" is already correct, no update needed

-- Update profile business_name fields to properly reflect their business affiliations
UPDATE profiles 
SET 
  business_name = 'Anime Fresno',
  updated_at = now()
WHERE email = 'kamikazefresno@gmail.com'
  AND role = 'business';

UPDATE profiles 
SET 
  business_name = 'Collectors Collision',
  updated_at = now()
WHERE email = 'dsocial@live.com'
  AND role = 'business';

UPDATE profiles 
SET 
  business_name = 'Anime Fresno',
  updated_at = now()
WHERE email = 'kimochicon@gmail.com'
  AND role = 'business';