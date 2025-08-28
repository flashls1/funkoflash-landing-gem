-- Fix the business_account_user relationships using correct profile IDs
-- The previous migration used user_id instead of profile.id for the BAU relationship

-- First, clear the incorrectly created BAU records
DELETE FROM public.business_account_user WHERE user_id IN (
    SELECT p.id FROM public.profiles p WHERE p.role = 'business'::app_role
);

-- Now create proper BAU relationships using the correct profile.id (not user_id)
-- Match by email since that's the most reliable
INSERT INTO public.business_account_user (user_id, business_account_id)
SELECT 
    p.id as user_id,  -- Use profile.id, not profile.user_id
    ba.id as business_account_id
FROM public.profiles p
JOIN public.business_account ba ON ba.contact_email = p.email
WHERE p.role = 'business'::app_role
    AND p.active = true
ON CONFLICT (user_id, business_account_id) DO NOTHING;

-- Also match by business name as fallback
INSERT INTO public.business_account_user (user_id, business_account_id)
SELECT 
    p.id as user_id,  -- Use profile.id, not profile.user_id
    ba.id as business_account_id
FROM public.profiles p
JOIN public.business_account ba ON ba.name = p.business_name
WHERE p.role = 'business'::app_role
    AND p.active = true
    AND NOT EXISTS (
        SELECT 1 FROM public.business_account_user bau 
        WHERE bau.user_id = p.id AND bau.business_account_id = ba.id
    )
ON CONFLICT (user_id, business_account_id) DO NOTHING;