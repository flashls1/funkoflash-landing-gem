-- COMPREHENSIVE BUSINESS EVENT VISIBILITY FIX v2025-08-28
-- Creates secure views, functions, and RLS policies for business event access

-- 1. Helper: Is Admin?
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = uid AND p.role IN ('admin')
  );
$$;

-- 2. Helper: validate business visibility via junction
CREATE OR REPLACE FUNCTION public.validate_business_visibility(business_account_id uuid, uid uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_account_user bau
    WHERE bau.business_account_id = validate_business_visibility.business_account_id
      AND bau.user_id = uid
  );
$$;

-- 3. Create tables if they don't exist (idempotent)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES business_events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_account_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES business_events(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'performer',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, talent_id)
);

-- 4. Create secure views with proper joins
CREATE OR REPLACE VIEW public.v_business_calendar_events AS
SELECT
  e.id,
  e.title,
  e.status,
  e.start_ts AS start_at,
  e.end_ts AS end_at,
  'America/Chicago' AS timezone,
  e.city,
  e.country,
  e.venue,
  e.updated_at,
  b.business_account_id
FROM public.bookings b
JOIN public.business_events e ON e.id = b.event_id
JOIN public.business_account_user bau ON bau.business_account_id = b.business_account_id;

CREATE OR REPLACE VIEW public.v_talent_calendar_events AS
SELECT
  e.id,
  e.title,
  e.status,
  e.start_ts AS start_at,
  e.end_ts AS end_at,
  'America/Chicago' AS timezone,
  e.city,
  e.country,
  e.venue,
  e.updated_at,
  ep.talent_id
FROM public.business_events e
JOIN public.event_participants ep ON ep.event_id = e.id;

-- Set security barriers
ALTER VIEW public.v_business_calendar_events SET (security_barrier = true);
ALTER VIEW public.v_talent_calendar_events SET (security_barrier = true);

-- 5. Enable RLS on all relevant tables
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_account_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS events_select ON public.business_events;
DROP POLICY IF EXISTS bookings_select ON public.bookings;
DROP POLICY IF EXISTS business_accounts_select ON public.business_account;
DROP POLICY IF EXISTS bau_select ON public.business_account_user;
DROP POLICY IF EXISTS event_participants_select ON public.event_participants;

-- 7. Create comprehensive RLS policies
CREATE POLICY events_select ON public.business_events
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.business_account_user bau ON bau.business_account_id = b.business_account_id
      WHERE b.event_id = business_events.id AND bau.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.event_participants ep
      JOIN public.talent_profiles tp ON tp.id = ep.talent_id
      WHERE ep.event_id = business_events.id AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY bookings_select ON public.bookings
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.business_account_user bau
      WHERE bau.business_account_id = bookings.business_account_id
        AND bau.user_id = auth.uid()
    )
  );

CREATE POLICY business_accounts_select ON public.business_account
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.business_account_user bau
      WHERE bau.business_account_id = business_account.id
        AND bau.user_id = auth.uid()
    )
  );

CREATE POLICY bau_select ON public.business_account_user
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR business_account_user.user_id = auth.uid()
  );

CREATE POLICY event_participants_select ON public.event_participants
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.talent_profiles tp
      WHERE tp.id = event_participants.talent_id AND tp.user_id = auth.uid()
    )
  );

-- 8. Grant permissions on views
GRANT SELECT ON public.v_business_calendar_events TO anon, authenticated;
GRANT SELECT ON public.v_talent_calendar_events TO authenticated;

-- 9. Create admin policies for data management
CREATE POLICY bookings_admin_manage ON public.bookings
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY event_participants_admin_manage ON public.event_participants
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY bau_admin_manage ON public.business_account_user
  FOR ALL USING (public.is_admin(auth.uid()));

-- 10. Populate bookings table from existing business_event_account data
INSERT INTO public.bookings (business_account_id, event_id, status)
SELECT bea.business_account_id, bea.event_id, 'confirmed'
FROM public.business_event_account bea
WHERE NOT EXISTS (
  SELECT 1 FROM public.bookings b 
  WHERE b.business_account_id = bea.business_account_id 
    AND b.event_id = bea.event_id
);

-- 11. Populate event_participants from existing talent_event data
INSERT INTO public.event_participants (event_id, talent_id, role)
SELECT te.event_id, te.talent_id, 'performer'
FROM public.talent_event te
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_participants ep
  WHERE ep.event_id = te.event_id AND ep.talent_id = te.talent_id
);