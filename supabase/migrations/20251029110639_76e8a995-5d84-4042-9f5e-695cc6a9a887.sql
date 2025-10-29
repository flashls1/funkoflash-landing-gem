-- Fix all schema mismatches between DB and application code

-- 1) business_events: add missing columns used by UI
ALTER TABLE public.business_events
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS daily_schedule jsonb;

-- 2) business_account: add missing columns and rename for consistency
ALTER TABLE public.business_account
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS contact_email text;

-- Update name from company_name if null
UPDATE public.business_account SET name = company_name WHERE name IS NULL AND company_name IS NOT NULL;

-- 3) business_event_travel: add status column
ALTER TABLE public.business_event_travel
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 4) business_event_talent: add financial tracking columns
ALTER TABLE public.business_event_talent
  ADD COLUMN IF NOT EXISTS per_diem_amount numeric,
  ADD COLUMN IF NOT EXISTS per_diem_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS guarantee_amount numeric,
  ADD COLUMN IF NOT EXISTS guarantee_currency text DEFAULT 'USD';

-- 5) user_profile_data: needs user_id in structure (already has it, ensure constraint)
-- Already has user_id from earlier migration

-- 6) Create business_event_transport table (referenced by TravelHotelSection)
CREATE TABLE IF NOT EXISTS public.business_event_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.business_events(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  transport_type text, -- 'flight', 'train', 'car', 'other'
  departure_location text,
  arrival_location text,
  departure_time timestamptz,
  arrival_time timestamptz,
  confirmation_code text,
  carrier text, -- airline, train company, etc
  notes text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on business_event_transport
ALTER TABLE public.business_event_transport ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_event_transport
CREATE POLICY "Admins can manage all transport"
  ON public.business_event_transport FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Talent can view their transport"
  ON public.business_event_transport FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.talent_profiles tp
    WHERE tp.id = business_event_transport.talent_id 
      AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Business can view transport for their events"
  ON public.business_event_transport FOR SELECT
  USING (
    has_role(auth.uid(), 'business') 
    AND EXISTS (
      SELECT 1 FROM public.business_event_account bea
      JOIN public.business_account ba ON ba.id = bea.business_account_id
      WHERE bea.event_id = business_event_transport.event_id
        AND ba.user_id = auth.uid()
    )
  );

-- Updated-at trigger for business_event_transport
CREATE TRIGGER update_business_event_transport_updated_at
  BEFORE UPDATE ON public.business_event_transport
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Fix ensure_business_account_exists function parameter name
DROP FUNCTION IF EXISTS public.ensure_business_account_exists(uuid);
CREATE OR REPLACE FUNCTION public.ensure_business_account_exists(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _account_id uuid;
BEGIN
  SELECT id INTO _account_id FROM public.business_account WHERE user_id = _user_id;
  
  IF _account_id IS NULL THEN
    INSERT INTO public.business_account (user_id)
    VALUES (_user_id)
    RETURNING id INTO _account_id;
  END IF;
  
  RETURN _account_id;
END; $$;

-- Keep the p_user_id version for backward compatibility
CREATE OR REPLACE FUNCTION public.ensure_business_account_exists_v2(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.ensure_business_account_exists(p_user_id);
END; $$;
