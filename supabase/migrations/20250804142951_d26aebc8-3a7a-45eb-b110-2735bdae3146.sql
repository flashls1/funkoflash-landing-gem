-- Remove hero_image_url column from events table since hero images should only be controlled by site_design_settings
ALTER TABLE public.events DROP COLUMN IF EXISTS hero_image_url;