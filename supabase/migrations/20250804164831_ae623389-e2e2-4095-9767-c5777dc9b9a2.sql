-- Create storage policies for event-images bucket
CREATE POLICY "Event images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');

CREATE POLICY "Users can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update event images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete event images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');