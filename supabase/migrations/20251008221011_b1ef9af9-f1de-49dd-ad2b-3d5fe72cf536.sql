-- Fix handle_new_user trigger to respect role from raw_user_meta_data and create talent_profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role public.app_role := 'talent'::public.app_role;
  should_confirm boolean := false;
BEGIN
  -- Check if this user should be auto-confirmed (admin-created)
  should_confirm := COALESCE(NEW.raw_user_meta_data ->> 'admin_created', 'false')::boolean;
  
  -- Get role from metadata if provided, otherwise default to talent
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    user_role := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
  END IF;
  
  -- Check if this is an admin email
  IF NEW.email IN ('admin@funkoflash.com', 'flash@funkoflash.com') THEN
    user_role := 'admin'::public.app_role;
    should_confirm := true;
  END IF;

  -- Auto-confirm email if this user was created by admin
  IF should_confirm AND NEW.email_confirmed_at IS NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = now()
    WHERE id = NEW.id;
  END IF;

  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    user_role
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (NEW.id, user_role, COALESCE((NEW.raw_user_meta_data ->> 'created_by')::uuid, NEW.id));
  
  -- If role is talent, create talent_profile automatically
  IF user_role = 'talent'::public.app_role THEN
    INSERT INTO public.talent_profiles (
      user_id, 
      name, 
      slug, 
      active, 
      public_visibility
    ) VALUES (
      NEW.id,
      COALESCE(
        TRIM(NEW.raw_user_meta_data ->> 'first_name' || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')),
        TRIM(NEW.raw_user_meta_data ->> 'first_name'),
        NEW.email
      ),
      public.generate_unique_talent_slug(
        COALESCE(
          TRIM(NEW.raw_user_meta_data ->> 'first_name' || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')),
          TRIM(NEW.raw_user_meta_data ->> 'first_name'),
          NEW.email
        )
      ),
      true,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Backfill missing user_roles entries for existing users
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT p.user_id, p.role, p.user_id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix Maddie Mason's specific user_roles entry
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT p.user_id, p.role, p.user_id
FROM public.profiles p
WHERE p.email = 'maddiescosplay@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
  )
ON CONFLICT (user_id, role) DO NOTHING;