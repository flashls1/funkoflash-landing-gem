-- Create business_account table first (dependency for business_event_account)
CREATE TABLE IF NOT EXISTS public.business_account (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,  
  contact_email TEXT,
  contact_phone TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_events table
CREATE TABLE public.business_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  start_ts TIMESTAMP WITH TIME ZONE,
  end_ts TIMESTAMP WITH TIME ZONE,
  city TEXT,
  state TEXT,
  country TEXT,
  address_line TEXT,
  website TEXT,
  hero_logo_path TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_event_talent junction table
CREATE TABLE public.business_event_talent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.business_events(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  UNIQUE(event_id, talent_id)
);

-- Create business_event_account junction table  
CREATE TABLE public.business_event_account (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.business_events(id) ON DELETE CASCADE,
  business_account_id UUID NOT NULL REFERENCES public.business_account(id) ON DELETE CASCADE,
  UNIQUE(event_id, business_account_id)
);

-- Enable RLS on all tables
ALTER TABLE public.business_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_talent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_account ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_account
CREATE POLICY "Admins can manage all business accounts" ON public.business_account
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all business accounts" ON public.business_account  
  FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));

-- RLS policies for business_events
CREATE POLICY "Admins can manage all business events" ON public.business_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all business events" ON public.business_events
  FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Business members can manage their events" ON public.business_events
  FOR ALL USING (
    has_role(auth.uid(), 'business'::app_role) AND
    EXISTS (
      SELECT 1 FROM business_event_account bea
      JOIN business_account ba ON ba.id = bea.business_account_id  
      WHERE bea.event_id = business_events.id
    )
  );

CREATE POLICY "Talent can view events they're attached to" ON public.business_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_event_talent bet
      JOIN talent_profiles tp ON tp.id = bet.talent_id
      WHERE bet.event_id = business_events.id AND tp.user_id = auth.uid()
    )
  );

-- RLS policies for business_event_talent
CREATE POLICY "Admins can manage talent assignments" ON public.business_event_talent
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage talent assignments" ON public.business_event_talent
  FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));

-- RLS policies for business_event_account
CREATE POLICY "Admins can manage account assignments" ON public.business_event_account
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage account assignments" ON public.business_event_account
  FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));

-- Create storage bucket for business events
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-events', 'business-events', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for business-events bucket
CREATE POLICY "Public can view business event images" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-events');

CREATE POLICY "Admins and Staff can upload business event images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-events' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  );

CREATE POLICY "Admins and Staff can update business event images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'business-events' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  );

-- Add triggers for updated_at columns
CREATE TRIGGER update_business_account_updated_at
  BEFORE UPDATE ON public.business_account
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_events_updated_at
  BEFORE UPDATE ON public.business_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();