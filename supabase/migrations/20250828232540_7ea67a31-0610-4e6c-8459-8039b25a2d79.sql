-- Fix business_events RLS policies to allow admin/staff to manage events
-- Currently admins can only SELECT, but need full CRUD access

-- Add UPDATE policy for admins and staff
CREATE POLICY "Admins and staff can update business events" 
ON public.business_events 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Add INSERT policy for admins and staff
CREATE POLICY "Admins and staff can insert business events" 
ON public.business_events 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Add DELETE policy for admins and staff
CREATE POLICY "Admins and staff can delete business events" 
ON public.business_events 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);