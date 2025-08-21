-- 1. Immediate cleanup: Deactivate Jesse's talent profile
UPDATE talent_profiles 
SET active = false, public_visibility = false, updated_at = now()
WHERE user_id = 'c08a6d1a-13b5-44d6-84af-ef7b90072a31';

-- 2. Enhanced handle_role_change trigger function
CREATE OR REPLACE FUNCTION public.handle_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When role changes to 'talent', ensure talent_profile exists
  IF NEW.role = 'talent'::app_role AND OLD.role != 'talent'::app_role THEN
    -- Check if talent_profile already exists
    IF NOT EXISTS (SELECT 1 FROM talent_profiles WHERE user_id = NEW.user_id) THEN
      -- Create talent profile with basic info from user profile
      INSERT INTO talent_profiles (user_id, name, slug, active, public_visibility)
      VALUES (
        NEW.user_id,
        COALESCE(TRIM(NEW.first_name || ' ' || NEW.last_name), TRIM(NEW.first_name), NEW.email),
        LOWER(REPLACE(COALESCE(TRIM(NEW.first_name || ' ' || NEW.last_name), TRIM(NEW.first_name), NEW.email), ' ', '-')),
        true,
        false -- Default to not public until manually set
      );
    ELSE
      -- Reactivate existing talent profile
      UPDATE talent_profiles 
      SET active = true, updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  -- When role changes FROM 'talent' to something else, deactivate talent profile
  IF OLD.role = 'talent'::app_role AND NEW.role != 'talent'::app_role THEN
    UPDATE talent_profiles 
    SET active = false, public_visibility = false, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- When role changes to 'business', ensure business_account exists
  IF NEW.role = 'business'::app_role AND OLD.role != 'business'::app_role THEN
    -- Call the function to ensure business account exists
    PERFORM ensure_business_account_exists(NEW.user_id);
    
    -- Also ensure any talent profile is deactivated
    UPDATE talent_profiles 
    SET active = false, public_visibility = false, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Clear any existing user_roles for this user and set the new role
  DELETE FROM user_roles WHERE user_id = NEW.user_id;
  INSERT INTO user_roles (user_id, role, assigned_by)
  VALUES (NEW.user_id, NEW.role, auth.uid());

  RETURN NEW;
END;
$function$;

-- 3. Add function to cleanup orphaned talent profiles for admins
CREATE OR REPLACE FUNCTION public.cleanup_business_talent_profiles()
 RETURNS TABLE(cleaned_profile_id uuid, profile_name text, user_role app_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admin/staff to run this
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to cleanup talent profiles';
  END IF;
  
  RETURN QUERY
  UPDATE talent_profiles 
  SET active = false, public_visibility = false, updated_at = now()
  FROM profiles p
  WHERE talent_profiles.user_id = p.user_id 
    AND p.role != 'talent'::app_role 
    AND talent_profiles.active = true
  RETURNING talent_profiles.id, talent_profiles.name, p.role;
END;
$function$;