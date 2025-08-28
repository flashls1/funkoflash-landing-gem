-- CONSOLIDATED FIX: Business Events Dropdown and Visibility
-- This migration ensures Jesse Ortega appears in admin dropdown and sees only his events

-- STEP 1: Ensure business_account_user relationships are correct
-- Fix any missing BAU relationships for business users
INSERT INTO business_account_user (user_id, business_account_id)
SELECT DISTINCT p.id, ba.id
FROM profiles p
JOIN business_account ba ON (
    ba.contact_email = p.email 
    OR (p.business_name IS NOT NULL AND ba.name = p.business_name)
)
WHERE p.role = 'business'::app_role
  AND NOT EXISTS (
    SELECT 1 FROM business_account_user bau 
    WHERE bau.user_id = p.id AND bau.business_account_id = ba.id
  )
ON CONFLICT DO NOTHING;

-- STEP 2: Ensure Jesse's event "Collectors Collision" is properly linked
-- First get Jesse's business account
DO $$
DECLARE
    jesse_business_account_id uuid;
    collectors_collision_event_id uuid;
    anime_fresno_event_id uuid;
BEGIN
    -- Get Jesse's business account ID
    SELECT ba.id INTO jesse_business_account_id
    FROM business_account ba
    WHERE ba.contact_email = 'dsocial@live.com'
    LIMIT 1;
    
    -- Get Collectors Collision event ID
    SELECT be.id INTO collectors_collision_event_id
    FROM business_events be
    WHERE LOWER(be.title) LIKE '%collectors collision%'
    LIMIT 1;
    
    -- Get Anime Fresno event ID
    SELECT be.id INTO anime_fresno_event_id
    FROM business_events be
    WHERE LOWER(be.title) LIKE '%anime fresno%'
    LIMIT 1;
    
    -- Link Collectors Collision to Jesse's business account
    IF jesse_business_account_id IS NOT NULL AND collectors_collision_event_id IS NOT NULL THEN
        INSERT INTO business_event_account (event_id, business_account_id)
        VALUES (collectors_collision_event_id, jesse_business_account_id)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Linked Collectors Collision event to Jesse business account';
    END IF;
    
    -- Ensure Anime Fresno is NOT linked to Jesse's business account
    IF jesse_business_account_id IS NOT NULL AND anime_fresno_event_id IS NOT NULL THEN
        DELETE FROM business_event_account 
        WHERE event_id = anime_fresno_event_id 
          AND business_account_id = jesse_business_account_id;
        
        RAISE NOTICE 'Removed any link between Anime Fresno and Jesse business account';
    END IF;
END $$;

-- STEP 3: Create/Update visibility validator function
CREATE OR REPLACE FUNCTION public.debug_business_visibility_consolidated(p_email text)
RETURNS TABLE(
    test_name text, 
    ok boolean, 
    details text,
    visible_events text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE 
    v_user_id uuid; 
    v_profile_id uuid;
    should_count int; 
    visible_titles text[];
    jesse_has_collectors boolean := false;
    jesse_has_anime boolean := false;
BEGIN
    -- Get user and profile ID
    SELECT p.user_id, p.id INTO v_user_id, v_profile_id 
    FROM profiles p 
    WHERE LOWER(p.email) = LOWER(p_email);
    
    IF v_user_id IS NULL THEN 
        RETURN QUERY SELECT 
            'user_exists'::text, 
            false, 
            ('No profile for ' || p_email)::text,
            ARRAY[]::text[];
        RETURN; 
    END IF;
    
    -- Get visible event titles through BAU->BEA graph
    SELECT array_agg(DISTINCT be.title ORDER BY be.title) INTO visible_titles
    FROM business_events be 
    JOIN business_event_account bea ON bea.event_id = be.id
    JOIN business_account_user bau ON bau.business_account_id = bea.business_account_id
    WHERE bau.user_id = v_profile_id;
    
    -- Check specific events for Jesse
    IF LOWER(p_email) = 'dsocial@live.com' THEN
        -- Check if Jesse can see Collectors Collision
        SELECT EXISTS (
            SELECT 1 FROM business_events be 
            JOIN business_event_account bea ON bea.event_id = be.id
            JOIN business_account_user bau ON bau.business_account_id = bea.business_account_id
            WHERE bau.user_id = v_profile_id 
              AND LOWER(be.title) LIKE '%collectors collision%'
        ) INTO jesse_has_collectors;
        
        -- Check if Jesse can see Anime Fresno (should be false)
        SELECT EXISTS (
            SELECT 1 FROM business_events be 
            JOIN business_event_account bea ON bea.event_id = be.id
            JOIN business_account_user bau ON bau.business_account_id = bea.business_account_id
            WHERE bau.user_id = v_profile_id 
              AND LOWER(be.title) LIKE '%anime fresno%'
        ) INTO jesse_has_anime;
        
        -- Return Jesse-specific results
        RETURN QUERY SELECT 
            'jesse_collectors_access'::text,
            jesse_has_collectors,
            ('Jesse can see Collectors Collision: ' || jesse_has_collectors::text)::text,
            COALESCE(visible_titles, ARRAY[]::text[]);
            
        RETURN QUERY SELECT 
            'jesse_anime_blocked'::text,
            NOT jesse_has_anime,
            ('Jesse blocked from Anime Fresno: ' || (NOT jesse_has_anime)::text)::text,
            COALESCE(visible_titles, ARRAY[]::text[]);
    END IF;
    
    -- General visibility count
    SELECT COUNT(DISTINCT be.id) INTO should_count
    FROM business_events be 
    JOIN business_event_account bea ON bea.event_id = be.id
    JOIN business_account_user bau ON bau.business_account_id = bea.business_account_id
    WHERE bau.user_id = v_profile_id;
    
    RETURN QUERY SELECT 
        'total_visible_events'::text,
        (should_count > 0),
        format('User can see %s events: %s', should_count, COALESCE(array_to_string(visible_titles, ', '), 'none'))::text,
        COALESCE(visible_titles, ARRAY[]::text[]);
END $$;