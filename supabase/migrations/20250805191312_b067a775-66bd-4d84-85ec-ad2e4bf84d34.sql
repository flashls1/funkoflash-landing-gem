-- Create test users for validation
-- First, let's make sure we can create users via the signup flow

-- Create a function to easily create test users
CREATE OR REPLACE FUNCTION create_test_user(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_role app_role DEFAULT 'talent'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Generate a UUID for the user
  user_uuid := gen_random_uuid();
  
  -- Insert into profiles table directly (simulating what the trigger would do)
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    active
  ) VALUES (
    user_uuid,
    p_email,
    p_first_name,
    p_last_name,
    p_role,
    true
  );
  
  RETURN user_uuid;
END;
$$;

-- Create John Doe as talent
SELECT create_test_user('john.doe@example.com', 'John', 'Doe', 'talent');

-- Create Jane Smith as staff  
SELECT create_test_user('jane.smith@example.com', 'Jane', 'Smith', 'staff');