-- Create function to update talent sort order for drag-and-drop reordering
CREATE OR REPLACE FUNCTION public.update_talent_sort_order(talent_updates jsonb[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  talent_update jsonb;
BEGIN
  -- Only allow admin/staff to update sort order
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to update talent sort order';
  END IF;
  
  -- Update each talent's sort_rank
  FOREACH talent_update IN ARRAY talent_updates
  LOOP
    UPDATE talent_profiles 
    SET 
      sort_rank = (talent_update->>'sort_rank')::integer,
      updated_at = now()
    WHERE id = (talent_update->>'id')::uuid;
  END LOOP;
END;
$function$