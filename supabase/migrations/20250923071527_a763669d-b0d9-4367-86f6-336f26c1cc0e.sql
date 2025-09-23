-- Create storage bucket for talent headshots if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('talent-headshots', 'talent-headshots', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Anyone can view talent headshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins and staff can upload talent headshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins and staff can update talent headshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins and staff can delete talent headshots" ON storage.objects;

-- Create RLS policies for talent headshots bucket
CREATE POLICY "talent_headshots_admin_staff_upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'talent-headshots' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
));

CREATE POLICY "talent_headshots_public_view"
ON storage.objects
FOR SELECT
USING (bucket_id = 'talent-headshots');

CREATE POLICY "talent_headshots_admin_staff_update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'talent-headshots' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
));

CREATE POLICY "talent_headshots_admin_staff_delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'talent-headshots' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
));