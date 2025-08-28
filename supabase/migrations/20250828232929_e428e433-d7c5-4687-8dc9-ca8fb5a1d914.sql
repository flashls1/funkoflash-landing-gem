-- Fix RLS policies for business_event_account table
-- Currently only has SELECT policy, missing INSERT/UPDATE/DELETE for admin/staff

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