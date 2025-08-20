-- Create travel details table for business events
CREATE TABLE public.business_event_travel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  airline_name TEXT,
  confirmation_codes TEXT,
  status TEXT DEFAULT 'Not Booked' CHECK (status IN ('Booked', 'Not Booked')),
  arrival_datetime TIMESTAMPTZ,
  departure_datetime TIMESTAMPTZ,
  flight_tickets_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(event_id, talent_id)
);

-- Create hotel details table for business events
CREATE TABLE public.business_event_hotel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  hotel_name TEXT,
  hotel_address TEXT,
  confirmation_number TEXT,
  checkin_date DATE,
  checkout_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(event_id, talent_id)
);

-- Add primary business assignment to business_events
ALTER TABLE public.business_events 
ADD COLUMN primary_business_id UUID;

-- Enable RLS on new tables
ALTER TABLE public.business_event_travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_hotel ENABLE ROW LEVEL SECURITY;

-- RLS policies for travel details
CREATE POLICY "Admins can manage all travel details" 
ON public.business_event_travel 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all travel details" 
ON public.business_event_travel 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Business members can manage their events travel" 
ON public.business_event_travel 
FOR ALL 
USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    WHERE bea.event_id = business_event_travel.event_id
  )
);

CREATE POLICY "Talent can manage their own travel details" 
ON public.business_event_travel 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = business_event_travel.talent_id 
    AND tp.user_id = auth.uid()
  )
);

-- RLS policies for hotel details
CREATE POLICY "Admins can manage all hotel details" 
ON public.business_event_hotel 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all hotel details" 
ON public.business_event_hotel 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Business members can manage their events hotel" 
ON public.business_event_hotel 
FOR ALL 
USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    WHERE bea.event_id = business_event_hotel.event_id
  )
);

CREATE POLICY "Talent can manage their own hotel details" 
ON public.business_event_hotel 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = business_event_hotel.talent_id 
    AND tp.user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_business_event_travel_updated_at
  BEFORE UPDATE ON public.business_event_travel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_event_hotel_updated_at
  BEFORE UPDATE ON public.business_event_hotel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint for notes length (50 chars max)
ALTER TABLE public.business_event_travel 
ADD CONSTRAINT travel_notes_length CHECK (char_length(notes) <= 50);

ALTER TABLE public.business_event_hotel 
ADD CONSTRAINT hotel_notes_length CHECK (char_length(notes) <= 50);