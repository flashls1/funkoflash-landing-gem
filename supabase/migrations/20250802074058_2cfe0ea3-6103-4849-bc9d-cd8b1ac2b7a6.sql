-- Check and create design-assets bucket if needed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('design-assets', 'design-assets', true, 52428800, ARRAY['image/*', 'video/*'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*', 'video/*'];

-- Create comprehensive storage policies for design-assets bucket
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