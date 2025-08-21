-- Create business account for Jesse from Collectors Collison
INSERT INTO business_account (name, contact_email, contact_phone, address_line, city, state, country)
VALUES ('Collectors Collison', 'dsocial@live.com', NULL, NULL, NULL, NULL, 'USA');

-- Create a function to automatically create business accounts for business users
CREATE OR REPLACE FUNCTION public.ensure_business_account_exists(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

  -- Check if business account already exists for this business name
  SELECT id INTO v_business_account_id 
  FROM business_account 
  WHERE name = COALESCE(v_profile.business_name, v_profile.first_name || ' ' || COALESCE(v_profile.last_name, ''))
  LIMIT 1;

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
  END IF;

  RETURN v_business_account_id;
END;
$function$;