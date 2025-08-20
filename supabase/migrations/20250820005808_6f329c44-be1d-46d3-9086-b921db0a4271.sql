-- Idempotent migration to add 'business' role
-- Check if 'business' already exists in the app_role enum before adding it
DO $$
BEGIN
    -- Check if 'business' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'business' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        -- Add 'business' to the existing app_role enum
        ALTER TYPE public.app_role ADD VALUE 'business';
    END IF;
END$$;

-- Create permissions table if it doesn't exist (RBAC scaffolding)
CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scope text NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create role_permissions table if it doesn't exist (RBAC scaffolding)  
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_key app_role NOT NULL,
    permission_scope text NOT NULL REFERENCES public.permissions(scope) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(role_key, permission_scope)
);

-- Enable RLS on new tables if they were just created
DO $$
BEGIN
    -- Enable RLS on permissions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND schemaname = 'public'
    ) THEN
        ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
        
        -- Allow admins to manage permissions
        CREATE POLICY "Admins can manage permissions" ON public.permissions
        FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
        
        -- Allow authenticated users to view permissions
        CREATE POLICY "Authenticated users can view permissions" ON public.permissions
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    -- Enable RLS on role_permissions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'role_permissions' AND schemaname = 'public'
    ) THEN
        ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
        
        -- Allow admins to manage role permissions
        CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
        FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
        
        -- Allow authenticated users to view role permissions
        CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END$$;

-- Add basic permissions if they don't exist
INSERT INTO public.permissions (scope, description) 
VALUES 
    ('profiles.read_own', 'Read own profile')
ON CONFLICT (scope) DO NOTHING;

INSERT INTO public.permissions (scope, description) 
VALUES 
    ('profiles.update_own', 'Update own profile')
ON CONFLICT (scope) DO NOTHING;

-- Grant business role same basic permissions as talent (conservative approach)
INSERT INTO public.role_permissions (role_key, permission_scope)
VALUES 
    ('business'::app_role, 'profiles.read_own'),
    ('business'::app_role, 'profiles.update_own')
ON CONFLICT (role_key, permission_scope) DO NOTHING;

-- Add trigger for updated_at if tables were created
DO $$
BEGIN
    -- Add trigger for permissions table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_permissions_updated_at'
    ) THEN
        CREATE TRIGGER update_permissions_updated_at
        BEFORE UPDATE ON public.permissions
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END$$;