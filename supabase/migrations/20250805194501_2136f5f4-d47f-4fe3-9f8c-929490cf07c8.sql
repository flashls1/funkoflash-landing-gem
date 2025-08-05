-- Create or replace the handle_new_user function to auto-confirm admin-created users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    -- Update the user to be confirmed
    UPDATE auth.users 
    SET 
      email_confirmed_at = now(),
      confirmed_at = now()
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
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();