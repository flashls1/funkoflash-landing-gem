-- Create event_dates table for unified date management
CREATE TABLE public.event_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  date_value DATE NOT NULL,
  date_label TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(event_id, date_value)
);

-- Add RLS policies for event_dates
ALTER TABLE public.event_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event dates" 
ON public.event_dates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage event dates" 
ON public.event_dates 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Business users can view event dates for their events" 
ON public.event_dates 
FOR SELECT 
USING (
  has_role(auth.uid(), 'business'::app_role) AND 
  EXISTS (
    SELECT 1 
    FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    JOIN profiles p ON p.email = ba.contact_email
    WHERE bea.event_id = event_dates.event_id 
    AND p.user_id = auth.uid()
  )
);

-- Add foreign key relationship to show_schedule_entries
ALTER TABLE public.show_schedule_entries 
ADD COLUMN event_date_id UUID REFERENCES public.event_dates(id) ON DELETE CASCADE;

-- Create function to manage event dates
CREATE OR REPLACE FUNCTION public.manage_event_date(
  p_event_id UUID,
  p_date_value DATE,
  p_date_label TEXT DEFAULT NULL,
  p_action TEXT DEFAULT 'upsert'
) RETURNS UUID AS $$
DECLARE
  v_date_id UUID;
  v_max_order INTEGER;
BEGIN
  -- Only allow admin/staff to manage event dates
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to manage event dates';
  END IF;

  IF p_action = 'delete' THEN
    -- Delete the date and all associated schedule entries
    UPDATE public.show_schedule_entries 
    SET active = false, updated_at = now(), updated_by = auth.uid()
    WHERE event_id = p_event_id AND day_date = p_date_value;
    
    DELETE FROM public.event_dates 
    WHERE event_id = p_event_id AND date_value = p_date_value;
    
    RETURN NULL;
  ELSE
    -- Get current max display order
    SELECT COALESCE(MAX(display_order), -1) + 1 INTO v_max_order
    FROM public.event_dates 
    WHERE event_id = p_event_id;
    
    -- Upsert the date
    INSERT INTO public.event_dates (event_id, date_value, date_label, display_order, created_by)
    VALUES (p_event_id, p_date_value, p_date_label, v_max_order, auth.uid())
    ON CONFLICT (event_id, date_value) 
    DO UPDATE SET 
      date_label = COALESCE(EXCLUDED.date_label, event_dates.date_label),
      updated_at = now(),
      updated_by = auth.uid()
    RETURNING id INTO v_date_id;
    
    RETURN v_date_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update timestamps
CREATE TRIGGER update_event_dates_updated_at
BEFORE UPDATE ON public.event_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();