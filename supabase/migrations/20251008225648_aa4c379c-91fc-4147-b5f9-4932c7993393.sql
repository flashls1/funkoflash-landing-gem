-- Add RLS policy so talent users can manage their own talent_profile
CREATE POLICY "Talent can manage their own profile"
ON public.talent_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id = talent_profiles.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id = talent_profiles.user_id
  )
);