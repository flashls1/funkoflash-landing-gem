-- Fix the SELECT policy for business_event_account to allow admin/staff to see all assignments

-- Update the existing SELECT policy to also allow admin/staff access
DROP POLICY IF EXISTS "bea_select" ON public.business_event_account;

CREATE POLICY "business_event_account_select" 
ON public.business_event_account 
FOR SELECT 
USING (
  -- Admin and staff can see all assignments
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR
  -- Business users can see assignments for their business accounts
  EXISTS (
    SELECT 1
    FROM business_account_user bau
    WHERE bau.business_account_id = business_event_account.business_account_id 
      AND bau.user_id = auth.uid()
  )
);