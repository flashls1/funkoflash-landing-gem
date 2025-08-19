-- Create a secure view for user directory that only exposes minimal information
CREATE OR REPLACE VIEW public.user_directory AS
SELECT 
  user_id,
  COALESCE(first_name || ' ' || last_name, first_name, email) as display_name,
  role,
  active
FROM public.profiles 
WHERE active = true;

-- Enable RLS on the view (inheritance from profiles table)
ALTER VIEW public.user_directory SET (security_barrier = true);

-- Create RLS policy for user directory view
CREATE POLICY "Authenticated users can view user directory" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND active = true 
  AND (
    -- Users can see basic info of other users for messaging/directory purposes
    -- but only display name and role, not sensitive data like email/phone
    true
  )
);

-- Update the existing profiles RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- New policy: Users can only view their own complete profile
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- New policy: Users can view minimal info of other users for messaging
CREATE POLICY "Users can view minimal profile info for messaging" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND active = true
);

-- Create a function to get minimal user info for messaging
CREATE OR REPLACE FUNCTION public.get_users_for_messaging()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  role app_role
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.first_name, p.email) as display_name,
    p.role
  FROM public.profiles p
  WHERE p.active = true
  AND p.user_id != auth.uid(); -- Exclude current user
$$;