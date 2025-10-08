-- Create talent_module_access table
CREATE TABLE public.talent_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(talent_id, module_id)
);

-- Index for faster lookups
CREATE INDEX idx_talent_module_access_talent ON talent_module_access(talent_id);

-- Enable RLS
ALTER TABLE public.talent_module_access ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage all module access
CREATE POLICY "Admin/Staff can manage module access"
ON public.talent_module_access
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Talent users can view their own module access
CREATE POLICY "Talent can view own module access"
ON public.talent_module_access
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talent_profiles tp
    WHERE tp.id = talent_module_access.talent_id
    AND tp.user_id = auth.uid()
  )
);

-- Create helper function for initializing module access
CREATE OR REPLACE FUNCTION public.initialize_talent_module_access(p_talent_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  modules TEXT[] := ARRAY['events', 'calendar', 'messages', 'portfolio', 'earnings', 'performance', 'settings', 'opportunities', 'contracts'];
  module TEXT;
BEGIN
  -- Only allow admin/staff to initialize
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  FOREACH module IN ARRAY modules
  LOOP
    INSERT INTO talent_module_access (talent_id, module_id, is_locked, created_by)
    VALUES (p_talent_id, module, false, auth.uid())
    ON CONFLICT (talent_id, module_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Backfill existing talents with unlocked modules (direct insert without function call)
INSERT INTO public.talent_module_access (talent_id, module_id, is_locked, created_by)
SELECT 
  tp.id,
  module,
  false,
  NULL
FROM talent_profiles tp
CROSS JOIN (
  VALUES 
    ('events'), 
    ('calendar'), 
    ('messages'), 
    ('portfolio'), 
    ('earnings'), 
    ('performance'), 
    ('settings'), 
    ('opportunities'), 
    ('contracts')
) AS modules(module)
WHERE tp.user_id IS NOT NULL AND tp.active = true
ON CONFLICT (talent_id, module_id) DO NOTHING;