-- Add passport and visa image URL fields to talent_quick_view table
ALTER TABLE talent_quick_view 
ADD COLUMN passport_image_url TEXT,
ADD COLUMN visa_image_url TEXT;