-- Allow talents to view their assigned business events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'business_events' 
      AND policyname = 'Talent can view their assigned business events'
  ) THEN
    CREATE POLICY "Talent can view their assigned business events"
    ON public.business_events
    AS PERMISSIVE
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.business_event_talent bet
        JOIN public.talent_profiles tp ON tp.id = bet.talent_id
        WHERE bet.event_id = business_events.id
          AND tp.user_id = auth.uid()
      )
    );
  END IF;
END $$;