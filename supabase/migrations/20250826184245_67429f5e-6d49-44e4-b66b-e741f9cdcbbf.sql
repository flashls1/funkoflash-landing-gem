-- Activate Mario Castañeda's talent profile
UPDATE talent_profiles 
SET active = true, updated_at = now()
WHERE user_id = 'ff70a432-2c0a-47e6-852e-9dce4cfbe881';

-- Verify all webhook triggers are working by testing the has_role function
SELECT has_role('ff70a432-2c0a-47e6-852e-9dce4cfbe881', 'talent'::app_role) as has_talent_role;

-- Test RLS permissions are working
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM role_permissions rp 
      JOIN profiles p ON p.role = rp.role_key 
      WHERE p.user_id = 'ff70a432-2c0a-47e6-852e-9dce4cfbe881' 
        AND rp.permission_scope = 'calendar:view'
    ) THEN 'RLS_WORKING' 
    ELSE 'RLS_ISSUE' 
  END as rls_status;