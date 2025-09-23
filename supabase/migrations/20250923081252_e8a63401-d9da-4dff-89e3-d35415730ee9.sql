-- Add IV storage for encrypted passport and visa images
ALTER TABLE talent_quick_view 
ADD COLUMN passport_image_iv TEXT,
ADD COLUMN visa_image_iv TEXT;

-- Create storage bucket for encrypted documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('talent-documents', 'talent-documents', true);

-- Storage policies for encrypted documents
CREATE POLICY "Admin and staff can manage encrypted documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'talent-documents' AND (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'staff')
  )
));

CREATE POLICY "Users can view encrypted documents with proper access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'talent-documents' AND (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'staff')
  )
));