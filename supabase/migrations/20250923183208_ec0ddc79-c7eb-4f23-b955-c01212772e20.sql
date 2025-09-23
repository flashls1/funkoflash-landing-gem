-- Phase 1: Update RLS policies for admin-only hero image management

-- Drop existing RLS policies on site_design_settings
DROP POLICY IF EXISTS "Admins can manage all site design settings" ON public.site_design_settings;
DROP POLICY IF EXISTS "Anyone can view site design settings" ON public.site_design_settings;
DROP POLICY IF EXISTS "Staff can manage all site design settings" ON public.site_design_settings;

-- Create new strict admin-only policies
CREATE POLICY "Admins can manage hero settings"
ON public.site_design_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view settings (for display purposes)
CREATE POLICY "Anyone can view hero settings"
ON public.site_design_settings
FOR SELECT
USING (true);