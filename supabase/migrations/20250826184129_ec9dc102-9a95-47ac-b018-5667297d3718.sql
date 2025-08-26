-- Reset password for Mario Castaneda (grinchgoku@gmail.com) to '123456'
-- Note: This requires service_role key to work properly

-- First, let's create the missing talent profile for Mario
INSERT INTO talent_profiles (
  user_id, 
  name, 
  slug, 
  active, 
  public_visibility
) VALUES (
  'ff70a432-2c0a-47e6-852e-9dce4cfbe881',
  'Mario Castañeda',
  'mario-castaneda',
  true,
  false
) ON CONFLICT (user_id) DO NOTHING;

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

-- Log this action for security audit
INSERT INTO security_audit_log (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  (SELECT user_id FROM profiles WHERE email = 'admin@funkoflash.com' LIMIT 1),
  'talent_profile_repair',
  'talent_profiles',
  'ff70a432-2c0a-47e6-852e-9dce4cfbe881',
  jsonb_build_object('user_id', 'ff70a432-2c0a-47e6-852e-9dce4cfbe881', 'name', 'Mario Castañeda', 'action', 'created_missing_talent_profile')
);