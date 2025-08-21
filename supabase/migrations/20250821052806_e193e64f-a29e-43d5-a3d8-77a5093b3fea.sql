-- Fix access_requests table security issue
-- Remove any existing policies that might allow public access
DROP POLICY IF EXISTS "Anyone can create access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Public can create access requests" ON public.access_requests;

-- Create secure policies for access_requests table
-- Allow anonymous users to submit access requests (INSERT only)
CREATE POLICY "Anonymous users can submit access requests" 
ON public.access_requests 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Only allow admins and staff to view access requests
CREATE POLICY "Only admins can view access requests" 
ON public.access_requests 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only staff can view access requests" 
ON public.access_requests 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role));

-- Only allow admins to manage (update/delete) access requests
CREATE POLICY "Only admins can manage access requests" 
ON public.access_requests 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));