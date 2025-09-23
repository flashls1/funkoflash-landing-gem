-- COMPREHENSIVE FUNCTION SECURITY UPDATE - FINAL BATCH
-- Complete the security updates for all remaining functions

CREATE OR REPLACE FUNCTION public.ensure_business_account_exists(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_business_account_id uuid;
  v_profile public.profiles%ROWTYPE;
BEGIN
  -- Get the user profile
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id AND role = 'business';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not a business user';
  END IF;

  -- First try to find business account by email (most reliable)
  SELECT id INTO v_business_account_id 
  FROM public.business_account 
  WHERE contact_email = v_profile.email
  LIMIT 1;

  -- If not found by email, try by business_name
  IF v_business_account_id IS NULL AND v_profile.business_name IS NOT NULL THEN
    SELECT id INTO v_business_account_id 
    FROM public.business_account 
    WHERE name = v_profile.business_name
    LIMIT 1;
  END IF;

  -- If no business account exists, create one
  IF v_business_account_id IS NULL THEN
    INSERT INTO public.business_account (
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
    UPDATE public.business_account 
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

CREATE OR REPLACE FUNCTION public.generate_unique_talent_slug(p_name text, p_exclude_id uuid DEFAULT NULL::uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Generate base slug: normalize special characters, lowercase, replace spaces with hyphens
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(p_name, '[ñÑ]', 'n', 'g'),
        '[áàäâÁÀÄÂ]', 'a', 'g'
      ),
      '[éèëêÉÈËÊ]', 'e', 'g'
    )
  );
  base_slug := lower(regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (
    SELECT 1 FROM public.talent_profiles 
    WHERE slug = final_slug 
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_business_users()
RETURNS TABLE(profile_id uuid, user_id uuid, email text, first_name text, last_name text, business_name text, business_account_id uuid, business_account_name text, business_contact_email text, display_name text, business_display_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Only allow admin/staff to access this data
    IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)) THEN
        RAISE EXCEPTION 'Insufficient permissions to access business users data';
    END IF;
    
    RETURN QUERY
    SELECT DISTINCT
        p.id as profile_id,
        p.user_id,
        p.email,
        p.first_name,
        p.last_name,
        p.business_name,
        ba.id as business_account_id,
        ba.name as business_account_name,
        ba.contact_email as business_contact_email,
        -- Construct display name with fallbacks
        COALESCE(
            NULLIF(TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')), ''),
            NULLIF(TRIM(p.first_name), ''),
            p.email
        ) as display_name,
        -- Also include business name for context
        COALESCE(p.business_name, ba.name) as business_display_name
    FROM public.profiles p
    JOIN public.business_account_user bau ON bau.user_id = p.id
    JOIN public.business_account ba ON ba.id = bau.business_account_id
    WHERE p.role = 'business'::public.app_role
        AND p.active = true
    ORDER BY display_name, business_account_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_talent_users()
RETURNS TABLE(user_id uuid, name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only allow admin/staff to view this
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to view available users';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    COALESCE(TRIM(p.first_name || ' ' || p.last_name), TRIM(p.first_name), p.email) as name,
    p.email
  FROM public.profiles p
  WHERE p.role = 'talent'::public.app_role
    AND p.active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.talent_profiles tp WHERE tp.user_id = p.user_id
    )
  ORDER BY p.first_name, p.last_name;
END;
$function$;