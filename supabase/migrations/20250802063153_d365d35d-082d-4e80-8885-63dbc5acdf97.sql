-- Fix RLS policies for event-images storage bucket
CREATE POLICY "Admins can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can update event images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can update event images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete event images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can delete event images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Anyone can view event images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');

-- Add missing policies for events table
CREATE POLICY "Staff can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Create table for events page hero settings
CREATE TABLE public.events_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_image_url TEXT,
  hero_alt_text TEXT DEFAULT 'Events Hero Image',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS on events page settings
ALTER TABLE public.events_page_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for events page settings
CREATE POLICY "Anyone can view events page settings" 
ON public.events_page_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage events page settings" 
ON public.events_page_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.events_page_settings (hero_alt_text) 
VALUES ('Events Management Hero Image')
ON CONFLICT DO NOTHING;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_events_page_settings_updated_at
BEFORE UPDATE ON public.events_page_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();