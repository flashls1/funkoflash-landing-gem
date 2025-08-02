-- Fix the role assignment issue for existing users
-- Insert missing roles from profiles table to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::app_role 
FROM public.profiles 
WHERE role IS NOT NULL 
AND user_id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Update the has_role function to check both profiles and user_roles tables
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

-- Ensure events table has proper INSERT policies for admins
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
CREATE POLICY "Admins can create events" ON public.events
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Make sure talent assignments are truly optional by updating the events table
-- (talent assignments are handled separately in event_talent_assignments table)
-- No changes needed to events table structure as talent assignments are already separate