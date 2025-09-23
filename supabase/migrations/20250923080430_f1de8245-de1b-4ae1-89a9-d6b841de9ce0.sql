-- Add security fields to talent_quick_view table for image viewing protection
ALTER TABLE talent_quick_view 
ADD COLUMN birth_year INTEGER,
ADD COLUMN image_view_failed_attempts INTEGER DEFAULT 0,
ADD COLUMN image_view_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN image_view_locked_by_admin BOOLEAN DEFAULT FALSE;