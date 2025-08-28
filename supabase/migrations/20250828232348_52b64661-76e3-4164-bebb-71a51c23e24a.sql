-- Fix the get_admin_business_users function to work properly
-- The function was requiring admin/staff permissions in the WHERE clause which prevented it from working

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
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow admin/staff to access this data
    IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
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
    WHERE p.role = 'business'::app_role
        AND p.active = true
    ORDER BY display_name, business_account_name;
END $$;