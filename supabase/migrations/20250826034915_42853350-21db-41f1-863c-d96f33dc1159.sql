-- Create business event point of contact table
CREATE TABLE public.business_event_contact (
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

-- Create business event travel table (per talent)
CREATE TABLE public.business_event_travel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  airline_name TEXT,
  confirmation_codes TEXT,
  status TEXT DEFAULT 'Not Booked',
  arrival_datetime TIMESTAMP WITH TIME ZONE,
  departure_datetime TIMESTAMP WITH TIME ZONE,
  flight_tickets_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT business_event_travel_event_talent_unique UNIQUE (event_id, talent_id)
);

-- Create business event hotel table (per talent)
CREATE TABLE public.business_event_hotel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  hotel_name TEXT,
  hotel_address TEXT,
  confirmation_number TEXT,
  checkin_date TIMESTAMP WITH TIME ZONE,
  checkout_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT business_event_hotel_event_talent_unique UNIQUE (event_id, talent_id)
);

-- Create business event transportation table (per talent)
CREATE TABLE public.business_event_transport (
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

-- Enable RLS on all tables
ALTER TABLE public.business_event_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_hotel ENABLE ROW LEVEL SECURITY;
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

-- RLS Policies for business_event_travel
CREATE POLICY "Admins can manage all travel details" ON public.business_event_travel
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all travel details" ON public.business_event_travel
FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Business members can manage their events travel" ON public.business_event_travel
FOR ALL USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    WHERE bea.event_id = business_event_travel.event_id
  )
);

CREATE POLICY "Talent can manage their own travel details" ON public.business_event_travel
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp
    WHERE tp.id = business_event_travel.talent_id
    AND tp.user_id = auth.uid()
  )
);

-- RLS Policies for business_event_hotel (same pattern)
CREATE POLICY "Admins can manage all hotel details" ON public.business_event_hotel
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all hotel details" ON public.business_event_hotel
FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Business members can manage their events hotel" ON public.business_event_hotel
FOR ALL USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    WHERE bea.event_id = business_event_hotel.event_id
  )
);

CREATE POLICY "Talent can manage their own hotel details" ON public.business_event_hotel
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp
    WHERE tp.id = business_event_hotel.talent_id
    AND tp.user_id = auth.uid()
  )
);

-- RLS Policies for business_event_transport (same pattern)
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

-- Create triggers for updated_at
CREATE TRIGGER update_business_event_contact_updated_at
BEFORE UPDATE ON public.business_event_contact
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_event_travel_updated_at
BEFORE UPDATE ON public.business_event_travel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_event_hotel_updated_at
BEFORE UPDATE ON public.business_event_hotel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_event_transport_updated_at
BEFORE UPDATE ON public.business_event_transport
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();