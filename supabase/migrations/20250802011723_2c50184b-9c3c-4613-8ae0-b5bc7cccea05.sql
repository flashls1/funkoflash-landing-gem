-- Fix user roles system and update admin user
-- Update existing admin@funkoflash.com to have admin role
UPDATE public.profiles 
SET role = 'admin'::public.app_role 
WHERE email = 'admin@funkoflash.com';

-- Update the handle_new_user function to properly assign admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_role public.app_role := 'talent'::public.app_role;
BEGIN
  -- Check if this is an admin email
  IF NEW.email IN ('admin@funkoflash.com', 'flash@funkoflash.com') THEN
    user_role := 'admin'::public.app_role;
  END IF;

  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    user_role
  );
  RETURN NEW;
END;
$$;

-- Clean up any existing admin profile that might have wrong user_id
DELETE FROM public.profiles 
WHERE email = 'admin@funkoflash.com' 
AND user_id NOT IN (SELECT id FROM auth.users WHERE email = 'admin@funkoflash.com');