-- Add full_name column to talent_quick_view table for airline tickets
ALTER TABLE public.talent_quick_view 
ADD COLUMN full_name TEXT;