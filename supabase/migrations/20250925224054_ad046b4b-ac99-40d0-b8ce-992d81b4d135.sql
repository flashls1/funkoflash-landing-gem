-- Create schedule categories table with predefined categories
CREATE TABLE public.schedule_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL, -- HSL color value
  icon text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert predefined categories
INSERT INTO public.schedule_categories (name, color, icon, display_order) VALUES
  ('Panel', 'hsl(239, 84%, 67%)', '🎤', 1),
  ('Photo-Op', 'hsl(168, 83%, 42%)', '📸', 2),
  ('Autograph', 'hsl(26, 91%, 54%)', '✍️', 3),
  ('Contest', 'hsl(344, 79%, 51%)', '🏆', 4),
  ('Screening', 'hsl(262, 81%, 69%)', '🎬', 5),
  ('Travel', 'hsl(197, 95%, 43%)', '✈️', 6),
  ('General', 'hsl(216, 12%, 42%)', '📌', 7);

-- Create show schedule entries table for official event programming
CREATE TABLE public.show_schedule_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  day_date date NOT NULL,
  day_label text, -- e.g., "Saturday" or "Adult Cosplay Contest Day"
  time_start time NOT NULL,
  time_end time NOT NULL,
  title text NOT NULL,
  details text,
  category_id uuid REFERENCES public.schedule_categories(id),
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Create talent personal schedules table for private schedules
CREATE TABLE public.talent_personal_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id uuid NOT NULL,
  event_id uuid, -- Can be null for non-event related schedules
  schedule_date date NOT NULL,
  time_start time NOT NULL,
  time_end time NOT NULL,
  title text NOT NULL,
  description text,
  schedule_type text NOT NULL DEFAULT 'personal', -- personal, meeting, meal, travel, etc.
  color text DEFAULT 'hsl(216, 24%, 85%)', -- calm professional color
  private boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Create schedule bulk uploads table for tracking bulk upload sessions
CREATE TABLE public.schedule_bulk_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  upload_type text NOT NULL, -- 'show_schedule', 'personal_schedule'
  raw_text text NOT NULL,
  parsed_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Enable RLS on all tables
ALTER TABLE public.schedule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_personal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_bulk_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_categories
CREATE POLICY "Anyone can view schedule categories" 
ON public.schedule_categories FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage schedule categories" 
ON public.schedule_categories FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage schedule categories" 
ON public.schedule_categories FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for show_schedule_entries
CREATE POLICY "Admins can manage show schedule entries" 
ON public.show_schedule_entries FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage show schedule entries" 
ON public.show_schedule_entries FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Talent can view show schedule for their events" 
ON public.show_schedule_entries FOR SELECT 
USING (
  active = true AND (
    EXISTS (
      SELECT 1 FROM business_event_talent bet
      JOIN talent_profiles tp ON tp.id = bet.talent_id
      WHERE bet.event_id = show_schedule_entries.event_id
        AND tp.user_id = auth.uid()
    )
  )
);

-- RLS Policies for talent_personal_schedules
CREATE POLICY "Admins can manage all personal schedules" 
ON public.talent_personal_schedules FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all personal schedules" 
ON public.talent_personal_schedules FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Talent can manage their own personal schedules" 
ON public.talent_personal_schedules FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp
    WHERE tp.id = talent_personal_schedules.talent_id
      AND tp.user_id = auth.uid()
  )
);

-- RLS Policies for schedule_bulk_uploads
CREATE POLICY "Admins can manage bulk uploads" 
ON public.schedule_bulk_uploads FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage bulk uploads" 
ON public.schedule_bulk_uploads FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_schedule_categories_updated_at
  BEFORE UPDATE ON public.schedule_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_show_schedule_entries_updated_at
  BEFORE UPDATE ON public.show_schedule_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_talent_personal_schedules_updated_at
  BEFORE UPDATE ON public.talent_personal_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();