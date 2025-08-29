-- Fix security definer view issue by changing ownership from postgres superuser
-- to authenticator role, which respects RLS policies

-- Change ownership of views from postgres (superuser) to authenticator (respects RLS)
ALTER VIEW public.v_business_calendar_events OWNER TO authenticator;
ALTER VIEW public.v_business_events OWNER TO authenticator;
ALTER VIEW public.v_business_travel_finance OWNER TO authenticator;
ALTER VIEW public.v_talent_calendar_events OWNER TO authenticator;

-- Grant necessary permissions to roles that need to access these views
GRANT SELECT ON public.v_business_calendar_events TO anon, authenticated, service_role;
GRANT SELECT ON public.v_business_events TO anon, authenticated, service_role;
GRANT SELECT ON public.v_business_travel_finance TO anon, authenticated, service_role;
GRANT SELECT ON public.v_talent_calendar_events TO anon, authenticated, service_role;