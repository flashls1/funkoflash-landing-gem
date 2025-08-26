-- Clean up duplicate business accounts
-- First, identify and remove duplicates keeping the most recent one
WITH duplicates AS (
  SELECT 
    id,
    name,
    contact_email,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(name, contact_email) 
      ORDER BY created_at DESC
    ) as rn
  FROM business_account
  WHERE name IS NOT NULL OR contact_email IS NOT NULL
)
DELETE FROM business_account 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Update the ensure_business_account_exists function to prevent duplicates
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

  -- Check if business account already exists for this business (by name OR email)
  SELECT id INTO v_business_account_id 
  FROM business_account 
  WHERE (name = COALESCE(v_profile.business_name, v_profile.first_name || ' ' || COALESCE(v_profile.last_name, ''))
         OR contact_email = v_profile.email)
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