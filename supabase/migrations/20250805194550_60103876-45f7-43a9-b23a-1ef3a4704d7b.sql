-- Manually confirm the existing victhewop@aol.com user
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  confirmed_at = now()
WHERE email = 'victhewop@aol.com';