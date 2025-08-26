-- Add calendar permissions to role_permissions table
INSERT INTO role_permissions (role_key, permission_scope) VALUES 
('admin', 'calendar:edit'),
('admin', 'calendar:view'),
('admin', 'calendar:manage'),
('staff', 'calendar:edit'),
('staff', 'calendar:view'),
('talent', 'calendar:edit_own'),
('talent', 'calendar:view'),
('business', 'calendar:view')
ON CONFLICT (role_key, permission_scope) DO NOTHING;