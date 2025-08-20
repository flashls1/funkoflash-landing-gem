-- Create calendar_event table for Calendar Management module
CREATE TABLE public.calendar_event (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE SET NULL,
  event_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  timezone TEXT DEFAULT 'America/Chicago',
  all_day BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('booked', 'hold', 'available', 'tentative', 'cancelled')),
  venue_name TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'USA',
  address_line TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  url TEXT,
  notes_internal TEXT,
  notes_public TEXT,
  travel_in DATE,
  travel_out DATE,
  source_file TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.calendar_event ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar events (read-only for now)
CREATE POLICY "Users with calendar:view can view events" 
ON public.calendar_event 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp 
    JOIN public.profiles p ON p.role = rp.role_key 
    WHERE p.user_id = auth.uid() AND rp.permission_scope = 'calendar:view'
  )
);

-- Create index for performance
CREATE INDEX idx_calendar_event_dates ON public.calendar_event(start_date, end_date);
CREATE INDEX idx_calendar_event_talent ON public.calendar_event(talent_id);
CREATE INDEX idx_calendar_event_status ON public.calendar_event(status);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calendar_event_updated_at
BEFORE UPDATE ON public.calendar_event
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();