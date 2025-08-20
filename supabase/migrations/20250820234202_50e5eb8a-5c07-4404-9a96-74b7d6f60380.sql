-- Create talent assets management tables

-- Asset categories enum
CREATE TYPE public.asset_category AS ENUM ('headshot', 'character_image', 'bio', 'promo_video');

-- Asset formats enum  
CREATE TYPE public.asset_format AS ENUM ('transparent_png', 'png', 'jpeg', 'mp4', 'rich_text');

-- Talent assets table
CREATE TABLE public.talent_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL,
  category public.asset_category NOT NULL,
  format public.asset_format,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_size INTEGER,
  content_data JSONB, -- For rich text bios and video metadata
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Watermark settings table
CREATE TABLE public.watermark_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  business_logo_url TEXT,
  default_position TEXT DEFAULT 'lower-left',
  business_position TEXT DEFAULT 'lower-right',
  logo_size INTEGER DEFAULT 150,
  opacity NUMERIC(3,2) DEFAULT 0.8,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Business event access tracking
CREATE TABLE public.business_talent_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_event_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID,
  UNIQUE(business_event_id, talent_id)
);

-- Add foreign key constraints
ALTER TABLE public.talent_assets 
ADD CONSTRAINT fk_talent_assets_talent_id 
FOREIGN KEY (talent_id) REFERENCES public.talent_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.business_talent_access 
ADD CONSTRAINT fk_business_talent_access_event_id 
FOREIGN KEY (business_event_id) REFERENCES public.business_events(id) ON DELETE CASCADE;

ALTER TABLE public.business_talent_access 
ADD CONSTRAINT fk_business_talent_access_talent_id 
FOREIGN KEY (talent_id) REFERENCES public.talent_profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.talent_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watermark_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_talent_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for talent_assets
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
USING (
  EXISTS (
    SELECT 1 FROM public.talent_profiles tp 
    WHERE tp.id = talent_assets.talent_id 
    AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "Business users can view assets of assigned talents" 
ON public.talent_assets 
FOR SELECT 
USING (
  has_role(auth.uid(), 'business'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.business_talent_access bta
    JOIN public.business_event_account bea ON bea.event_id = bta.business_event_id
    JOIN public.business_account ba ON ba.id = bea.business_account_id
    WHERE bta.talent_id = talent_assets.talent_id
  )
);

-- RLS Policies for watermark_settings
CREATE POLICY "Admins can manage watermark settings" 
ON public.watermark_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage watermark settings" 
ON public.watermark_settings 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Anyone can view watermark settings" 
ON public.watermark_settings 
FOR SELECT 
USING (true);

-- RLS Policies for business_talent_access
CREATE POLICY "Admins can manage business talent access" 
ON public.business_talent_access 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage business talent access" 
ON public.business_talent_access 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('talent-headshots', 'talent-headshots', true),
('talent-character-images', 'talent-character-images', true),
('talent-promo-videos', 'talent-promo-videos', true),
('watermark-assets', 'watermark-assets', true);

-- Storage policies for talent-headshots
CREATE POLICY "Anyone can view headshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'talent-headshots');

CREATE POLICY "Talent can upload their own headshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'talent-headshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins and staff can manage all headshots" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'talent-headshots' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);

-- Storage policies for talent-character-images
CREATE POLICY "Anyone can view character images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'talent-character-images');

CREATE POLICY "Talent can upload their own character images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'talent-character-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins and staff can manage all character images" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'talent-character-images' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);

-- Storage policies for talent-promo-videos
CREATE POLICY "Business users can view assigned talent videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'talent-promo-videos' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'staff'::app_role)
    OR auth.uid()::text = (storage.foldername(name))[1]
    OR (
      has_role(auth.uid(), 'business'::app_role) 
      AND EXISTS (
        SELECT 1 FROM public.business_talent_access bta
        JOIN public.business_event_account bea ON bea.event_id = bta.business_event_id  
        JOIN public.business_account ba ON ba.id = bea.business_account_id
        JOIN public.talent_profiles tp ON tp.id = bta.talent_id
        WHERE tp.user_id::text = (storage.foldername(name))[1]
      )
    )
  )
);

CREATE POLICY "Talent can upload their own promo videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'talent-promo-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins and staff can manage all promo videos" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'talent-promo-videos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);

-- Storage policies for watermark-assets
CREATE POLICY "Anyone can view watermark assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'watermark-assets');

CREATE POLICY "Admins can manage watermark assets" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'watermark-assets' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add updated_at trigger
CREATE TRIGGER update_talent_assets_updated_at
  BEFORE UPDATE ON public.talent_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_watermark_settings_updated_at
  BEFORE UPDATE ON public.watermark_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default watermark settings
INSERT INTO public.watermark_settings (logo_url, default_position, business_position, logo_size, opacity) 
VALUES (NULL, 'lower-left', 'lower-right', 150, 0.8);