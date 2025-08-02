-- Fix storage policies for event-images bucket
DELETE FROM storage.policies WHERE bucket_id = 'event-images';

-- Allow public to view event images
CREATE POLICY "Anyone can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

-- Allow admins to upload event images  
CREATE POLICY "Admins can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow staff to upload event images
CREATE POLICY "Staff can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' AND 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Allow admins to update event images
CREATE POLICY "Admins can update event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow staff to update event images  
CREATE POLICY "Staff can update event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' AND 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Allow admins to delete event images
CREATE POLICY "Admins can delete event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow staff to delete event images
CREATE POLICY "Staff can delete event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' AND 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Fix events table policies - add missing INSERT policy for staff
CREATE POLICY "Staff can create events" ON public.events
FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Fix events table policies - add missing INSERT policy for admins (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Admins can create events'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can create events" ON public.events FOR INSERT WITH CHECK (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;