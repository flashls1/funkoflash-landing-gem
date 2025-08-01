-- Create talent_profiles table
CREATE TABLE public.talent_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(40) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  headshot_url TEXT,
  bio TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create directory_settings table for CMS banner
CREATE TABLE public.directory_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_image_url TEXT,
  banner_alt_text TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for talent_profiles
CREATE POLICY "Anyone can view active talent profiles" 
ON public.talent_profiles 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage all talent profiles" 
ON public.talent_profiles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all talent profiles" 
ON public.talent_profiles 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

-- RLS policies for directory_settings
CREATE POLICY "Anyone can view directory settings" 
ON public.directory_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage directory settings" 
ON public.directory_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage directory settings" 
ON public.directory_settings 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Create storage bucket for talent images
INSERT INTO storage.buckets (id, name, public) VALUES ('talent-images', 'talent-images', true);

-- Storage policies for talent images
CREATE POLICY "Anyone can view talent images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'talent-images');

CREATE POLICY "Admins can upload talent images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'talent-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can upload talent images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'talent-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can update talent images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'talent-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can update talent images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'talent-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete talent images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'talent-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can delete talent images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'talent-images' AND has_role(auth.uid(), 'staff'::app_role));

-- Create trigger for automatic timestamp updates on talent_profiles
CREATE TRIGGER update_talent_profiles_updated_at
BEFORE UPDATE ON public.talent_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on directory_settings
CREATE TRIGGER update_directory_settings_updated_at
BEFORE UPDATE ON public.directory_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default directory settings row
INSERT INTO public.directory_settings (banner_alt_text) VALUES ('Talent Directory Banner');