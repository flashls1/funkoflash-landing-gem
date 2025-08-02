-- Create events table with comprehensive fields
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  external_url TEXT,
  hero_image_url TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  visibility_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  visibility_end TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create event_talent_assignments table for many-to-many relationship
CREATE TABLE public.event_talent_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, talent_id)
);

-- Create events storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-images', 'event-images', true);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_talent_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Anyone can view active events in visibility window" 
ON public.events 
FOR SELECT 
USING (
  active = true 
  AND now() >= COALESCE(visibility_start, '-infinity'::timestamp with time zone)
  AND now() <= COALESCE(visibility_end, 'infinity'::timestamp with time zone)
);

CREATE POLICY "Admins can manage all events" 
ON public.events 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all events" 
ON public.events 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Create policies for event_talent_assignments
CREATE POLICY "Anyone can view talent assignments for active events" 
ON public.event_talent_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id 
    AND e.active = true 
    AND now() >= COALESCE(e.visibility_start, '-infinity'::timestamp with time zone)
    AND now() <= COALESCE(e.visibility_end, 'infinity'::timestamp with time zone)
  )
);

CREATE POLICY "Admins can manage all talent assignments" 
ON public.event_talent_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all talent assignments" 
ON public.event_talent_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Talent can view and update their own assignments" 
ON public.event_talent_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.talent_profiles tp 
    WHERE tp.id = talent_id 
    AND tp.user_id = auth.uid()
  )
);

-- Create storage policies for event images
CREATE POLICY "Anyone can view event images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');

CREATE POLICY "Admins can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can update event images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can update event images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete event images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can delete event images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'staff'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();