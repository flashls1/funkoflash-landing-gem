-- Manually confirm the existing victhewop@aol.com user (only email_confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'victhewop@aol.com';