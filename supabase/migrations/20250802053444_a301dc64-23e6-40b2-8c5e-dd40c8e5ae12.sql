-- Create site_design_settings table for storing design configurations
CREATE TABLE public.site_design_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(page_name)
);

-- Enable RLS
ALTER TABLE public.site_design_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for site design settings
CREATE POLICY "Admins can manage all site design settings" 
ON public.site_design_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all site design settings" 
ON public.site_design_settings 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Anyone can view site design settings" 
ON public.site_design_settings 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_design_settings_updated_at
BEFORE UPDATE ON public.site_design_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for design assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('design-assets', 'design-assets', true);

-- Create storage policies for design assets
CREATE POLICY "Anyone can view design assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'design-assets');

CREATE POLICY "Admins can upload design assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'design-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can upload design assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'design-assets' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can update design assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'design-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can update design assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'design-assets' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete design assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'design-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can delete design assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'design-assets' AND has_role(auth.uid(), 'staff'::app_role));

-- Insert default settings for each page
INSERT INTO public.site_design_settings (page_name, settings) VALUES
('home', '{"background": {"type": "color", "value": "hsl(var(--background))"}, "hero": {"title": "Welcome to Funko Flash", "subtitle": "Your premier destination for voice talent and entertainment"}, "colors": {"primary": "hsl(var(--primary))", "secondary": "hsl(var(--secondary))", "accent": "hsl(var(--accent))"}, "fonts": {"heading": "Inter", "body": "Inter"}}'),
('about', '{"background": {"type": "image", "value": "/src/assets/hero-about.jpg"}, "hero": {"title": "About Us", "subtitle": "Learn more about our story and mission"}, "colors": {"primary": "hsl(var(--primary))", "secondary": "hsl(var(--secondary))", "accent": "hsl(var(--accent))"}, "fonts": {"heading": "Inter", "body": "Inter"}}'),
('contact', '{"background": {"type": "image", "value": "/src/assets/hero-contact.jpg"}, "hero": {"title": "Contact Us", "subtitle": "Get in touch with our team"}, "colors": {"primary": "hsl(var(--primary))", "secondary": "hsl(var(--secondary))", "accent": "hsl(var(--accent))"}, "fonts": {"heading": "Inter", "body": "Inter"}}'),
('shop', '{"background": {"type": "image", "value": "/src/assets/hero-shop.jpg"}, "hero": {"title": "Shop", "subtitle": "Discover our exclusive products"}, "colors": {"primary": "hsl(var(--primary))", "secondary": "hsl(var(--secondary))", "accent": "hsl(var(--accent))"}, "fonts": {"heading": "Inter", "body": "Inter"}}'),
('events', '{"background": {"type": "image", "value": "/src/assets/hero-events.jpg"}, "hero": {"title": "Events", "subtitle": "Join us at upcoming events"}, "colors": {"primary": "hsl(var(--primary))", "secondary": "hsl(var(--secondary))", "accent": "hsl(var(--accent))"}, "fonts": {"heading": "Inter", "body": "Inter"}}'),
('talent-directory', '{"background": {"type": "image", "value": "/src/assets/hero-talent-directory.jpg"}, "hero": {"title": "Talent Directory", "subtitle": "Meet our amazing voice talent"}, "colors": {"primary": "hsl(var(--primary))", "secondary": "hsl(var(--secondary))", "accent": "hsl(var(--accent))"}, "fonts": {"heading": "Inter", "body": "Inter"}}');