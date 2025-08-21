-- Create talent_assets table
CREATE TABLE IF NOT EXISTS public.talent_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  format TEXT,
  file_size INTEGER,
  content_data JSONB,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT
);

-- Enable RLS on talent_assets
ALTER TABLE public.talent_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for talent_assets
CREATE POLICY "Admins can manage all talent assets" 
ON public.talent_assets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all talent assets" 
ON public.talent_assets 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Talent can manage their own assets" 
ON public.talent_assets 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM talent_profiles tp 
  WHERE tp.id = talent_assets.talent_id AND tp.user_id = auth.uid()
));

CREATE POLICY "Business users can view assets of assigned talents" 
ON public.talent_assets 
FOR SELECT 
USING (has_role(auth.uid(), 'business'::app_role) AND EXISTS (
  SELECT 1 FROM business_talent_access bta
  JOIN business_event_account bea ON bea.event_id = bta.business_event_id
  JOIN business_account ba ON ba.id = bea.business_account_id
  WHERE bta.talent_id = talent_assets.talent_id
));

-- Create missing talent_profiles record for Vic Mignogna
INSERT INTO public.talent_profiles (user_id, name, slug, active)
VALUES (
  'fc40e83b-d915-471f-9600-65b74ceb5d10',
  'Vic Mignogna',
  'vic-mignogna',
  true
);