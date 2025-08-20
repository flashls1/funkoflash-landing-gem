-- Add calendar permissions to RBAC system
INSERT INTO public.permissions (scope, description) VALUES
  ('calendar:view', 'View calendar module')
ON CONFLICT (scope) DO NOTHING;

-- Grant calendar:view permission to all existing roles
INSERT INTO public.role_permissions (role_key, permission_scope) VALUES
  ('admin', 'calendar:view'),
  ('staff', 'calendar:view'),
  ('talent', 'calendar:view'),
  ('business', 'calendar:view')
ON CONFLICT (role_key, permission_scope) DO NOTHING;