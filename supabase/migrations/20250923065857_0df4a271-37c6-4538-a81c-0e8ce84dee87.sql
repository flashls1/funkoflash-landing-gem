-- FINAL COMPREHENSIVE FUNCTION SECURITY FIX
-- Fix all remaining functions to use proper security settings

-- Update the trigger functions to proper security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_role public.app_role := 'talent'::public.app_role;
  should_confirm boolean := false;
BEGIN
  -- Check if this user should be auto-confirmed (admin-created)
  should_confirm := COALESCE(NEW.raw_user_meta_data ->> 'admin_created', 'false')::boolean;
  
  -- Check if this is an admin email
  IF NEW.email IN ('admin@funkoflash.com', 'flash@funkoflash.com') THEN
    user_role := 'admin'::public.app_role;
    should_confirm := true;
  END IF;

  -- Auto-confirm email if this user was created by admin
  IF should_confirm AND NEW.email_confirmed_at IS NULL THEN
    -- Update the user to be confirmed (only email_confirmed_at, not confirmed_at)
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
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- When role changes to 'talent', ensure talent_profile exists
  IF NEW.role = 'talent'::public.app_role AND OLD.role != 'talent'::public.app_role THEN
    -- Check if talent_profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.talent_profiles WHERE user_id = NEW.user_id) THEN
      -- Create talent profile with basic info from user profile
      INSERT INTO public.talent_profiles (user_id, name, slug, active, public_visibility)
      VALUES (
        NEW.user_id,
        COALESCE(TRIM(NEW.first_name || ' ' || NEW.last_name), TRIM(NEW.first_name), NEW.email),
        LOWER(REPLACE(COALESCE(TRIM(NEW.first_name || ' ' || NEW.last_name), TRIM(NEW.first_name), NEW.email), ' ', '-')),
        true,
        false -- Default to not public until manually set
      );
    ELSE
      -- Reactivate existing talent profile
      UPDATE public.talent_profiles 
      SET active = true, updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  -- When role changes FROM 'talent' to something else, deactivate talent profile
  IF OLD.role = 'talent'::public.app_role AND NEW.role != 'talent'::public.app_role THEN
    UPDATE public.talent_profiles 
    SET active = false, public_visibility = false, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- When role changes to 'business', ensure business_account exists
  IF NEW.role = 'business'::public.app_role AND OLD.role != 'business'::public.app_role THEN
    -- Call the function to ensure business account exists
    PERFORM public.ensure_business_account_exists(NEW.user_id);
    
    -- Also ensure any talent profile is deactivated
    UPDATE public.talent_profiles 
    SET active = false, public_visibility = false, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Clear any existing user_roles for this user and set the new role
  DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (NEW.user_id, NEW.role, auth.uid());

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.profiles 
  SET last_login = now() 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;