-- Create storage bucket for design assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('design-assets', 'design-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for design assets
CREATE POLICY "Anyone can view design assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'design-assets');

CREATE POLICY "Authenticated users can upload design assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'design-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update design assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'design-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete design assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'design-assets' AND auth.role() = 'authenticated');