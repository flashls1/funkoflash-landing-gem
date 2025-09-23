-- Create storage bucket for talent headshots if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('talent-headshots', 'talent-headshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for talent headshots bucket
CREATE POLICY "Admins and staff can upload talent headshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'talent-headshots' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
));

CREATE POLICY "Anyone can view talent headshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'talent-headshots');

CREATE POLICY "Admins and staff can update talent headshots"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'talent-headshots' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
));

CREATE POLICY "Admins and staff can delete talent headshots"
ON storage.objects
FOR DELETE
USING (bucket_id = 'talent-headshots' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
));