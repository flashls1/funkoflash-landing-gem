-- Clean up duplicate business accounts and standardize the business account matching logic

-- First, let's update the ensure_business_account_exists function to be more robust
CREATE OR REPLACE FUNCTION public.ensure_business_account_exists(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_account_id uuid;
  v_profile profiles%ROWTYPE;
BEGIN
  -- Get the user profile
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id AND role = 'business';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not a business user';
  END IF;

  -- First try to find business account by email (most reliable)
  SELECT id INTO v_business_account_id 
  FROM business_account 
  WHERE contact_email = v_profile.email
  LIMIT 1;

  -- If not found by email, try by business_name
  IF v_business_account_id IS NULL AND v_profile.business_name IS NOT NULL THEN
    SELECT id INTO v_business_account_id 
    FROM business_account 
    WHERE name = v_profile.business_name
    LIMIT 1;
  END IF;

  -- If no business account exists, create one
  IF v_business_account_id IS NULL THEN
    INSERT INTO business_account (
      name, 
      contact_email, 
      contact_phone, 
      address_line, 
      city, 
      state, 
      country
    ) VALUES (
      COALESCE(v_profile.business_name, v_profile.first_name || ' ' || COALESCE(v_profile.last_name, '')),
      v_profile.email,
      v_profile.phone,
      NULL,
      NULL,
      NULL,
      'USA'
    ) RETURNING id INTO v_business_account_id;
  ELSE
    -- Update existing business account with latest profile data
    UPDATE business_account 
    SET 
      contact_email = v_profile.email,
      contact_phone = v_profile.phone,
      name = COALESCE(v_profile.business_name, name),
      updated_at = now()
    WHERE id = v_business_account_id;
  END IF;

  RETURN v_business_account_id;
END;
$function$;

-- Create a helper function to find business account for a user (standardized lookup)
CREATE OR REPLACE FUNCTION public.get_business_account_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_account_id uuid;
  v_profile profiles%ROWTYPE;
BEGIN
  -- Get the user profile
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- First try to find business account by email (most reliable)
  SELECT id INTO v_business_account_id 
  FROM business_account 
  WHERE contact_email = v_profile.email
  LIMIT 1;

  -- If not found by email and user has business_name, try by business_name
  IF v_business_account_id IS NULL AND v_profile.business_name IS NOT NULL THEN
    SELECT id INTO v_business_account_id 
    FROM business_account 
    WHERE name = v_profile.business_name
    LIMIT 1;
  END IF;

  -- If not found by business_name, try by constructed name
  IF v_business_account_id IS NULL THEN
    SELECT id INTO v_business_account_id 
    FROM business_account 
    WHERE name = v_profile.first_name || ' ' || COALESCE(v_profile.last_name, '')
    LIMIT 1;
  END IF;

  RETURN v_business_account_id;
END;
$function$;