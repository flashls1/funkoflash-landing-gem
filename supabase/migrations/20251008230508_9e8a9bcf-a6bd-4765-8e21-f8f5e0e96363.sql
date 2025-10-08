-- Replace manage-own policy with a simpler condition
DROP POLICY IF EXISTS "Talent can manage their own profile" ON public.talent_profiles;

CREATE POLICY "Talent can manage their own profile"
ON public.talent_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());