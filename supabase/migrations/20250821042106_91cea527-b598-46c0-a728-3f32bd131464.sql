-- Update the handle_role_change function to handle business role assignments
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- When role changes to 'talent', ensure talent_profile exists
  IF NEW.role = 'talent'::app_role AND OLD.role != 'talent'::app_role THEN
    -- Check if talent_profile already exists
    IF NOT EXISTS (SELECT 1 FROM talent_profiles WHERE user_id = NEW.user_id) THEN
      -- Create talent profile with basic info from user profile
      INSERT INTO talent_profiles (user_id, name, slug, active)
      VALUES (
        NEW.user_id,
        COALESCE(TRIM(NEW.first_name || ' ' || NEW.last_name), TRIM(NEW.first_name), NEW.email),
        LOWER(REPLACE(COALESCE(TRIM(NEW.first_name || ' ' || NEW.last_name), TRIM(NEW.first_name), NEW.email), ' ', '-')),
        true
      );
    END IF;
  END IF;

  -- When role changes from 'talent', we keep the talent_profile but set it as inactive
  IF OLD.role = 'talent'::app_role AND NEW.role != 'talent'::app_role THEN
    UPDATE talent_profiles 
    SET active = false 
    WHERE user_id = NEW.user_id;
  END IF;

  -- When role changes to 'business', ensure business_account exists
  IF NEW.role = 'business'::app_role AND OLD.role != 'business'::app_role THEN
    -- Call the function to ensure business account exists
    PERFORM ensure_business_account_exists(NEW.user_id);
  END IF;

  -- Clear any existing user_roles for this user and set the new role
  DELETE FROM user_roles WHERE user_id = NEW.user_id;
  INSERT INTO user_roles (user_id, role, assigned_by)
  VALUES (NEW.user_id, NEW.role, auth.uid());

  RETURN NEW;
END;
$function$;