-- Create Google Calendar connections table with encrypted token storage
CREATE TABLE public.gcal_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL,
  google_email TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(talent_id)
);

-- Enable RLS on gcal_connections
ALTER TABLE public.gcal_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for gcal_connections
CREATE POLICY "Admins can manage all Google Calendar connections" 
ON public.gcal_connections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all Google Calendar connections" 
ON public.gcal_connections 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Talent can manage their own Google Calendar connection" 
ON public.gcal_connections 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = gcal_connections.talent_id 
    AND tp.user_id = auth.uid()
  )
);

-- Add Google Calendar fields to calendar_event table
ALTER TABLE public.calendar_event 
ADD COLUMN IF NOT EXISTS gcal_event_id TEXT,
ADD COLUMN IF NOT EXISTS do_not_sync BOOLEAN DEFAULT false;

-- Update the updated_at trigger for gcal_connections
CREATE TRIGGER update_gcal_connections_updated_at
BEFORE UPDATE ON public.gcal_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to decrypt Google Calendar tokens (server-side only)
CREATE OR REPLACE FUNCTION public.get_gcal_tokens(p_talent_id UUID)
RETURNS TABLE(
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT,
  google_email TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow if user has calendar:edit permission or is the talent themselves
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role) OR
    EXISTS (
      SELECT 1 FROM talent_profiles tp 
      WHERE tp.id = p_talent_id 
      AND tp.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to access Google Calendar tokens';
  END IF;

  RETURN QUERY
  SELECT 
    gc.access_token,
    gc.refresh_token,
    gc.token_expiry,
    gc.calendar_id,
    gc.google_email
  FROM gcal_connections gc
  WHERE gc.talent_id = p_talent_id;
END;
$$;