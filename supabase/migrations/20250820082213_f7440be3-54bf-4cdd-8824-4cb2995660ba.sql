-- Weekend Matrix Import: Database setup for idempotent upsert and Replace Year mode

-- 1) Unique key for idempotent upsert
CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_event_dedupe
ON public.calendar_event (talent_id, event_title, start_date, end_date);

-- 2) Helper to check permissions via roles → role_permissions
CREATE OR REPLACE FUNCTION public.has_permission(p_uid uuid, p_scope text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.profiles p ON p.role = rp.role_key
    WHERE p.user_id = p_uid
      AND rp.permission_scope = p_scope
  );
$$;

-- 3) Fast year delete (used by Replace Year mode)
CREATE OR REPLACE FUNCTION public.delete_calendar_year(p_talent_id uuid, p_year int)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from date := make_date(p_year, 1, 1);
  v_to   date := make_date(p_year + 1, 1, 1);
  v_count integer;
BEGIN
  DELETE FROM public.calendar_event
   WHERE talent_id = p_talent_id
     AND start_date >= v_from
     AND start_date <  v_to;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;