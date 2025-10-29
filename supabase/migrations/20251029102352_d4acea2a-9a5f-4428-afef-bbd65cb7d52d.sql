-- =====================================================
-- SUPPLEMENTARY MIGRATION
-- Add missing columns and functions to match component expectations
-- =====================================================

-- Add missing columns to access_requests
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS message TEXT;

-- Add missing columns to talent_personal_schedules
ALTER TABLE public.talent_personal_schedules ADD COLUMN IF NOT EXISTS time_end TIME;
ALTER TABLE public.talent_personal_schedules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.talent_personal_schedules ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'personal';
ALTER TABLE public.talent_personal_schedules ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE;
ALTER TABLE public.talent_personal_schedules ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add missing columns to event_dates
ALTER TABLE public.event_dates ADD COLUMN IF NOT EXISTS date_value DATE;
ALTER TABLE public.event_dates ADD COLUMN IF NOT EXISTS date_label TEXT;
ALTER TABLE public.event_dates ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.event_dates ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Populate date_value from event_date
UPDATE public.event_dates SET date_value = event_date WHERE date_value IS NULL;

-- Add missing columns to show_schedule_entries
ALTER TABLE public.show_schedule_entries ADD COLUMN IF NOT EXISTS day_date DATE;
ALTER TABLE public.show_schedule_entries ADD COLUMN IF NOT EXISTS time_end TIME;
ALTER TABLE public.show_schedule_entries ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.show_schedule_entries ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.show_schedule_entries ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.show_schedule_entries ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Populate day_date from event_dates
UPDATE public.show_schedule_entries sse
SET day_date = ed.event_date
FROM public.event_dates ed
WHERE sse.event_date_id = ed.id AND sse.day_date IS NULL;

-- Add missing columns to schedule_categories
ALTER TABLE public.schedule_categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update schedule_categories sort_order to display_order
UPDATE public.schedule_categories SET display_order = sort_order WHERE display_order = 0;

-- Add missing columns to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS thread_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Populate is_read from read_at
UPDATE public.messages SET is_read = (read_at IS NOT NULL) WHERE is_read = false;

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Populate display_name from first_name and last_name
UPDATE public.profiles 
SET display_name = CONCAT(first_name, ' ', last_name)
WHERE display_name IS NULL AND first_name IS NOT NULL;

-- Add missing columns to business_event_contact
ALTER TABLE public.business_event_contact ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.business_event_contact ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.business_event_contact ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Populate new columns from old ones
UPDATE public.business_event_contact SET contact_name = name WHERE contact_name IS NULL;
UPDATE public.business_event_contact SET phone_number = phone WHERE phone_number IS NULL;
UPDATE public.business_event_contact SET contact_email = email WHERE contact_email IS NULL;

-- Add missing columns to user_activity_logs
ALTER TABLE public.user_activity_logs ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.user_activity_logs ADD COLUMN IF NOT EXISTS action TEXT;

-- Add missing column to profiles for status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get users for messaging
CREATE OR REPLACE FUNCTION public.get_users_for_messaging()
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    p.id as user_id,
    COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
    p.role
  FROM public.profiles p
  WHERE p.active = true
  ORDER BY p.first_name, p.last_name;
$$;

-- Update manage_event_date function parameters
CREATE OR REPLACE FUNCTION public.manage_event_date(
  _event_id UUID,
  _event_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _date_id UUID;
BEGIN
  -- Check if date already exists
  SELECT id INTO _date_id 
  FROM public.event_dates 
  WHERE event_id = _event_id AND event_date = _event_date;
  
  -- If not found, create it
  IF _date_id IS NULL THEN
    INSERT INTO public.event_dates (
      event_id, 
      event_date, 
      date_value,
      display_order,
      active
    )
    VALUES (
      _event_id, 
      _event_date,
      _event_date,
      (SELECT COALESCE(MAX(display_order), 0) + 1 FROM public.event_dates WHERE event_id = _event_id),
      true
    )
    RETURNING id INTO _date_id;
  END IF;
  
  RETURN _date_id;
END;
$$;

-- Create manage_event_date with action parameter (for delete operations)
CREATE OR REPLACE FUNCTION public.manage_event_date(
  p_event_id UUID,
  p_date_value DATE,
  p_action TEXT DEFAULT 'upsert'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _date_id UUID;
BEGIN
  IF p_action = 'delete' THEN
    -- Delete associated schedule entries first
    DELETE FROM public.show_schedule_entries
    WHERE event_date_id IN (
      SELECT id FROM public.event_dates 
      WHERE event_id = p_event_id AND date_value = p_date_value
    );
    
    -- Delete the date record
    DELETE FROM public.event_dates
    WHERE event_id = p_event_id AND date_value = p_date_value
    RETURNING id INTO _date_id;
    
    RETURN _date_id;
  ELSE
    -- Upsert the date
    INSERT INTO public.event_dates (
      event_id,
      event_date,
      date_value,
      display_order,
      active
    )
    VALUES (
      p_event_id,
      p_date_value,
      p_date_value,
      (SELECT COALESCE(MAX(display_order), 0) + 1 FROM public.event_dates WHERE event_id = p_event_id),
      true
    )
    ON CONFLICT (event_id, event_date) DO NOTHING
    RETURNING id INTO _date_id;
    
    -- If insert didn't happen due to conflict, get existing id
    IF _date_id IS NULL THEN
      SELECT id INTO _date_id
      FROM public.event_dates
      WHERE event_id = p_event_id AND date_value = p_date_value;
    END IF;
    
    RETURN _date_id;
  END IF;
END;
$$;

-- =====================================================
-- CREATE ADDITIONAL INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_event_dates_event_id ON public.event_dates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_dates_date_value ON public.event_dates(date_value);
CREATE INDEX IF NOT EXISTS idx_show_schedule_entries_event_date_id ON public.show_schedule_entries(event_date_id);
CREATE INDEX IF NOT EXISTS idx_show_schedule_entries_day_date ON public.show_schedule_entries(day_date);
CREATE INDEX IF NOT EXISTS idx_talent_personal_schedules_event_id ON public.talent_personal_schedules(event_id);
CREATE INDEX IF NOT EXISTS idx_talent_personal_schedules_schedule_date ON public.talent_personal_schedules(schedule_date);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================