-- Create business event point of contact table (only if not exists)
CREATE TABLE IF NOT EXISTS public.business_event_contact (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  contact_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT business_event_contact_event_id_unique UNIQUE (event_id)
);

-- Update existing business_event_travel table to add missing columns
ALTER TABLE public.business_event_travel 
ADD COLUMN IF NOT EXISTS confirmation_codes TEXT,
ADD COLUMN IF NOT EXISTS flight_tickets_url TEXT;

-- Update business_event_hotel table to add missing columns if needed
ALTER TABLE public.business_event_hotel 
ADD COLUMN IF NOT EXISTS checkin_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checkout_date TIMESTAMP WITH TIME ZONE;

-- Create business event transportation table (only if not exists)
CREATE TABLE IF NOT EXISTS public.business_event_transport (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  provider_type TEXT,
  provider_other TEXT,
  confirmation_code TEXT,
  pickup_datetime TIMESTAMP WITH TIME ZONE,
  dropoff_datetime TIMESTAMP WITH TIME ZONE,
  pickup_location TEXT,
  dropoff_location TEXT,
  transport_documents_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT business_event_transport_event_talent_unique UNIQUE (event_id, talent_id)
);

-- Enable RLS on new tables
ALTER TABLE public.business_event_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_transport ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_event_contact
CREATE POLICY "Admins can manage all contact details" ON public.business_event_contact
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all contact details" ON public.business_event_contact
FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Business members can manage their events contact" ON public.business_event_contact
FOR ALL USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    WHERE bea.event_id = business_event_contact.event_id
  )
);

CREATE POLICY "Talent can view contact details for their events" ON public.business_event_contact
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM business_event_talent bet
    JOIN talent_profiles tp ON tp.id = bet.talent_id
    WHERE bet.event_id = business_event_contact.event_id
    AND tp.user_id = auth.uid()
  )
);

-- RLS Policies for business_event_transport
CREATE POLICY "Admins can manage all transport details" ON public.business_event_transport
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all transport details" ON public.business_event_transport
FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Business members can manage their events transport" ON public.business_event_transport
FOR ALL USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    WHERE bea.event_id = business_event_transport.event_id
  )
);

CREATE POLICY "Talent can manage their own transport details" ON public.business_event_transport
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp
    WHERE tp.id = business_event_transport.talent_id
    AND tp.user_id = auth.uid()
  )
);

-- Create triggers for updated_at (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_event_contact_updated_at') THEN
    CREATE TRIGGER update_business_event_contact_updated_at
    BEFORE UPDATE ON public.business_event_contact
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_event_transport_updated_at') THEN
    CREATE TRIGGER update_business_event_transport_updated_at
    BEFORE UPDATE ON public.business_event_transport
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;