-- Check and fix business_event_account RLS policies
-- Some policies may already exist, so we'll use CREATE POLICY IF NOT EXISTS

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Admins and staff can insert business event accounts" ON public.business_event_account;
DROP POLICY IF EXISTS "Admins and staff can update business event accounts" ON public.business_event_account;
DROP POLICY IF EXISTS "Admins and staff can delete business event accounts" ON public.business_event_account;

-- Add INSERT policy for admin and staff
CREATE POLICY "Admins and staff can insert business event accounts" 
ON public.business_event_account 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Add UPDATE policy for admin and staff
CREATE POLICY "Admins and staff can update business event accounts" 
ON public.business_event_account 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Add DELETE policy for admin and staff
CREATE POLICY "Admins and staff can delete business event accounts" 
ON public.business_event_account 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);