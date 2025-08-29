-- Alternative approach: Recreate views with explicit security context
-- Drop and recreate views ensuring they don't have security definer properties

DROP VIEW IF EXISTS public.v_business_calendar_events CASCADE;
DROP VIEW IF EXISTS public.v_business_events CASCADE;
DROP VIEW IF EXISTS public.v_business_travel_finance CASCADE;
DROP VIEW IF EXISTS public.v_talent_calendar_events CASCADE;

-- Create views with explicit SECURITY INVOKER to ensure they use caller's permissions
-- Note: SECURITY INVOKER is the default, but we're being explicit to ensure compliance

-- Business calendar events view - respects RLS on underlying tables
CREATE VIEW public.v_business_calendar_events 
WITH (security_invoker = true) AS
SELECT 
    be.id AS event_id,
    be.title,
    be.status,
    be.start_ts AS start_at,
    be.end_ts AS end_at,
    be.city,
    be.state,
    be.country,
    be.venue,
    be.updated_at,
    bea.business_account_id,
    p.user_id AS profile_user_id
FROM business_events be
JOIN business_event_account bea ON bea.event_id = be.id
JOIN business_account_user bau ON bau.business_account_id = bea.business_account_id
JOIN profiles p ON p.id = bau.user_id;

-- Business events view - respects RLS on underlying tables
CREATE VIEW public.v_business_events 
WITH (security_invoker = true) AS
SELECT 
    id AS business_event_id,
    title,
    start_ts,
    end_ts,
    status,
    city,
    state,
    venue,
    website,
    daily_schedule
FROM business_events be;

-- Business travel finance view - respects RLS on underlying tables
CREATE VIEW public.v_business_travel_finance 
WITH (security_invoker = true) AS
SELECT 
    be.id AS business_event_id,
    sum(ts.cost_cents) AS total_cost_cents,
    jsonb_agg(ts.* ORDER BY ts.start_ts) FILTER (WHERE ts.id IS NOT NULL) AS segments
FROM business_events be
LEFT JOIN travel_segments ts ON ts.event_id = be.id
GROUP BY be.id;

-- Talent calendar events view - respects RLS on underlying tables
CREATE VIEW public.v_talent_calendar_events 
WITH (security_invoker = true) AS
SELECT 
    e.id AS event_id,
    e.title,
    e.status,
    e.start_ts AS start_at,
    e.end_ts AS end_at,
    ep.talent_id
FROM business_events e
JOIN event_participants ep ON ep.event_id = e.id;

-- Ensure proper permissions are granted
GRANT SELECT ON public.v_business_calendar_events TO anon, authenticated, service_role;
GRANT SELECT ON public.v_business_events TO anon, authenticated, service_role;
GRANT SELECT ON public.v_business_travel_finance TO anon, authenticated, service_role;
GRANT SELECT ON public.v_talent_calendar_events TO anon, authenticated, service_role;