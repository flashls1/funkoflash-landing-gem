-- Additional schema fixes for remaining type mismatches

-- 1) talent_assets: add missing columns
ALTER TABLE public.talent_assets
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS content_data jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- 2) watermark_settings: add missing columns
ALTER TABLE public.watermark_settings
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS business_logo_url text,
  ADD COLUMN IF NOT EXISTS logo_size integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS default_position text DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS business_position text DEFAULT 'center';

-- 3) profiles: add preferred_language column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- 4) site_design_settings: add page_name for page-specific designs
ALTER TABLE public.site_design_settings
  ADD COLUMN IF NOT EXISTS page_name text;

CREATE UNIQUE INDEX IF NOT EXISTS site_design_settings_page_name_key 
  ON public.site_design_settings(page_name) 
  WHERE page_name IS NOT NULL;

-- 5) Create public_events table (view for public event listings)
CREATE TABLE IF NOT EXISTS public.public_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  venue_name text,
  location_city text,
  location_state text,
  location_country text,
  image_url text,
  ticket_url text,
  status text DEFAULT 'published',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.public_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for public_events
CREATE POLICY "Public can view published events"
  ON public.public_events FOR SELECT
  USING (active = true AND status = 'published');

CREATE POLICY "Admins can manage all public events"
  ON public.public_events FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Trigger for updated_at
CREATE TRIGGER update_public_events_updated_at
  BEFORE UPDATE ON public.public_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Add event_talent_assignments table for many-to-many Events <-> Talent
CREATE TABLE IF NOT EXISTS public.event_talent_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.public_events(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  role text, -- their role in the event
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, talent_id)
);

-- Enable RLS
ALTER TABLE public.event_talent_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Public can view talent assignments"
  ON public.event_talent_assignments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage talent assignments"
  ON public.event_talent_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
