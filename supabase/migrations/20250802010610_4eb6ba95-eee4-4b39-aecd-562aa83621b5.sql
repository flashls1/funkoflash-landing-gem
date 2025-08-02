-- Create admin user account in auth.users and profiles tables
-- First, insert into auth.users (this requires special handling)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  gen_random_uuid(),
  'admin@funkoflash.com',
  crypt('Temp123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Admin", "last_name": "User"}',
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert profile for the admin user
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  role
) 
SELECT 
  id,
  'admin@funkoflash.com',
  'Admin',
  'User',
  'admin'::app_role
FROM auth.users 
WHERE email = 'admin@funkoflash.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin'::app_role;

-- Ensure the admin user has admin role in user_roles table
INSERT INTO public.user_roles (
  user_id,
  role
)
SELECT 
  id,
  'admin'::app_role
FROM auth.users 
WHERE email = 'admin@funkoflash.com'
ON CONFLICT (user_id, role) DO NOTHING;