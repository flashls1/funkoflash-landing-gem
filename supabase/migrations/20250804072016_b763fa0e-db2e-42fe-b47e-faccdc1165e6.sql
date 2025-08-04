-- Fix storage policies for design-assets bucket
-- First, check and create proper policies for uploads

-- Create policy for authenticated users to upload to design-assets bucket
CREATE POLICY "Authenticated users can upload design assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'design-assets' 
  AND auth.uid() IS NOT NULL
);

-- Create policy for authenticated users to update their own design assets
CREATE POLICY "Users can update their own design assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'design-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for everyone to view design assets (public bucket)
CREATE POLICY "Everyone can view design assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'design-assets');

-- Create policy for users to delete their own design assets
CREATE POLICY "Users can delete their own design assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'design-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);