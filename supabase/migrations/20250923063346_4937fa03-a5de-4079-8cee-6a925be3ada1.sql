-- Create talent_quick_view table
CREATE TABLE public.talent_quick_view (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) <= 80),
  dob DATE,
  email TEXT,
  phone TEXT,
  passport_number TEXT,
  visa_number TEXT,
  local_airport TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  popular_roles TEXT,
  special_notes TEXT,
  headshot_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.talent_quick_view ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage all records
CREATE POLICY "Admin and staff can manage talent quick view" 
ON public.talent_quick_view 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_talent_quick_view_updated_at
BEFORE UPDATE ON public.talent_quick_view
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();