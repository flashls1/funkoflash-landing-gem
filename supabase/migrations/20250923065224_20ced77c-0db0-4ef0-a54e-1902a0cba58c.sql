-- Fix Function Search Path Security Issues
-- Update functions to use proper search_path security

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = uid AND p.role IN ('admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(p_uid uuid, p_scope text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.profiles p ON p.role = rp.role_key
    WHERE p.user_id = p_uid
      AND rp.permission_scope = p_scope
  );
$$;