-- Add policies for admins and staff to upload avatars for any user
CREATE POLICY "Admins can upload any user avatar" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can upload any user avatar" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'avatars' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can update any user avatar" 
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can update any user avatar" 
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete any user avatar" 
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can delete any user avatar" 
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'staff'::app_role));