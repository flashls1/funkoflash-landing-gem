-- Fix storage RLS policies for event-images bucket using the correct storage.objects table
-- Note: In Supabase, storage policies are applied to storage.objects, not storage.policies

-- First, remove any existing conflicting policies for event-images bucket
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete event images" ON storage.objects;

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

-- Add missing INSERT policies for events table
CREATE POLICY "Staff can create events" ON public.events
FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role));