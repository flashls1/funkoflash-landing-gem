-- Create ui_settings table for appearance settings
CREATE TABLE IF NOT EXISTS public.ui_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.ui_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ui_settings
CREATE POLICY "Admins can manage ui settings"
ON public.ui_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage ui settings"
ON public.ui_settings
FOR ALL
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Anyone can view ui settings"
ON public.ui_settings
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_ui_settings_updated_at
  BEFORE UPDATE ON public.ui_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default appearance settings
INSERT INTO public.ui_settings (key, value) VALUES (
  'appearance',
  '{
    "bgMode": "siteImage",
    "watermarkOpacity": 0.04,
    "watermarkScale": 1.0,
    "rippleEnabled": false,
    "rippleIntensity": 0.75,
    "rippleFollow": "cursor"
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;