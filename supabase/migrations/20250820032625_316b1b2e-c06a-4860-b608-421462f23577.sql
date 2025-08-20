-- Ensure calendar:view permission exists for admin and staff roles
INSERT INTO public.permissions(scope, description)
VALUES ('calendar:view','View calendar module')
ON CONFLICT (scope) DO NOTHING;

INSERT INTO public.role_permissions(role_key, permission_scope) VALUES
('admin','calendar:view'),
('staff','calendar:view')
ON CONFLICT (role_key, permission_scope) DO NOTHING;