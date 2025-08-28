-- STEP 1: Create secure view for admin business users dropdown
-- This view lists all users with role='business' and their associated business accounts
-- Uses business_account_user junction table as source of truth

CREATE OR REPLACE VIEW public.v_admin_business_users AS
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
WHERE p.role = 'business'::app_role
    AND p.active = true
ORDER BY display_name, business_account_name;

-- Enable RLS on the view (views inherit table policies but we want explicit control)
-- Note: Views can't have RLS policies directly, but we'll create a function for access control

-- Create a secure function to get business users for admin
CREATE OR REPLACE FUNCTION public.get_admin_business_users()
RETURNS TABLE (
    profile_id uuid,
    user_id uuid,
    email text,
    first_name text,
    last_name text,
    business_name text,
    business_account_id uuid,
    business_account_name text,
    business_contact_email text,
    display_name text,
    business_display_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    -- Only allow admin/staff to access this data
    SELECT 
        v.profile_id,
        v.user_id,
        v.email,
        v.first_name,
        v.last_name,
        v.business_name,
        v.business_account_id,
        v.business_account_name,
        v.business_contact_email,
        v.display_name,
        v.business_display_name
    FROM public.v_admin_business_users v
    WHERE has_role(auth.uid(), 'admin'::app_role) 
       OR has_role(auth.uid(), 'staff'::app_role);
$$;

-- Ensure all existing business users have BAU records
-- This will help Jesse Ortega and others appear if they're missing BAU links
INSERT INTO public.business_account_user (user_id, business_account_id)
SELECT 
    p.id as user_id,
    ba.id as business_account_id
FROM public.profiles p
JOIN public.business_account ba ON (
    ba.contact_email = p.email 
    OR ba.name = p.business_name
    OR ba.name = TRIM(p.first_name || ' ' || COALESCE(p.last_name, ''))
)
WHERE p.role = 'business'::app_role
    AND p.active = true
    AND NOT EXISTS (
        SELECT 1 FROM public.business_account_user bau 
        WHERE bau.user_id = p.id AND bau.business_account_id = ba.id
    )
ON CONFLICT (user_id, business_account_id) DO NOTHING;

-- Create business accounts for business users who don't have any
DO $$
DECLARE
    business_user RECORD;
    new_business_account_id uuid;
BEGIN
    FOR business_user IN 
        SELECT p.id, p.user_id, p.email, p.first_name, p.last_name, p.business_name, p.phone
        FROM public.profiles p
        WHERE p.role = 'business'::app_role 
            AND p.active = true
            AND NOT EXISTS (
                SELECT 1 FROM public.business_account_user bau 
                WHERE bau.user_id = p.id
            )
    LOOP
        -- Create a business account for this user
        INSERT INTO public.business_account (
            name, 
            contact_email, 
            contact_phone, 
            country
        ) VALUES (
            COALESCE(
                business_user.business_name,
                TRIM(business_user.first_name || ' ' || COALESCE(business_user.last_name, '')),
                business_user.email
            ),
            business_user.email,
            business_user.phone,
            'USA'
        ) RETURNING id INTO new_business_account_id;
        
        -- Link the user to this business account
        INSERT INTO public.business_account_user (user_id, business_account_id)
        VALUES (business_user.id, new_business_account_id);
        
        RAISE NOTICE 'Created business account % for user %', new_business_account_id, business_user.email;
    END LOOP;
END $$;