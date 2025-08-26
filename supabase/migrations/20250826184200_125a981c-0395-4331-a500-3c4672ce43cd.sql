-- Check existing talent profile and fix Mario Castaneda's setup
-- First, let's see if there's a conflicting talent profile

-- If there's an existing talent profile with his name but different user_id, connect it
UPDATE talent_profiles 
SET user_id = 'ff70a432-2c0a-47e6-852e-9dce4cfbe881',
    name = 'Mario Castañeda',
    updated_at = now()
WHERE slug = 'mario-castaneda' 
  AND (user_id IS NULL OR user_id != 'ff70a432-2c0a-47e6-852e-9dce4cfbe881');

-- Create user_roles record for consistency  
INSERT INTO user_roles (
  user_id, 
  role, 
  assigned_by
) VALUES (
  'ff70a432-2c0a-47e6-852e-9dce4cfbe881',
  'talent'::app_role,
  (SELECT user_id FROM profiles WHERE email = 'admin@funkoflash.com' LIMIT 1)
) ON CONFLICT (user_id, role) DO NOTHING;

-- Now reset the password using auth admin function 
-- Note: This requires service_role privileges
UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE id = 'ff70a432-2c0a-47e6-852e-9dce4cfbe881';

-- Log this action for security audit
INSERT INTO security_audit_log (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  (SELECT user_id FROM profiles WHERE email = 'admin@funkoflash.com' LIMIT 1),
  'password_reset_and_profile_repair',
  'profiles',
  'ff70a432-2c0a-47e6-852e-9dce4cfbe881',
  jsonb_build_object(
    'user_id', 'ff70a432-2c0a-47e6-852e-9dce4cfbe881', 
    'name', 'Mario Castañeda', 
    'password_changed', true,
    'talent_profile_connected', true
  )
);