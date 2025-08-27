-- Update get_public_talent_showcase function to be SECURITY DEFINER
-- This allows the function to bypass RLS policies and return public talent data
-- regardless of the caller's role
CREATE OR REPLACE FUNCTION public.get_public_talent_showcase()
 RETURNS TABLE(id uuid, name character varying, slug character varying, headshot_url text, preview_bio text, sort_rank integer, has_user_account boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    tp.id,
    tp.name,
    tp.slug,
    tp.headshot_url,
    CASE
      WHEN (tp.bio IS NOT NULL AND length(tp.bio) > 0) 
      THEN (left(tp.bio, 200) || '...')
      ELSE NULL
    END AS preview_bio,
    tp.sort_rank,
    (tp.user_id IS NOT NULL) AS has_user_account
  FROM talent_profiles tp
  WHERE tp.active = true 
    AND tp.public_visibility = true
    AND (
      tp.user_id IS NULL  -- Admin-created profiles without users
      OR EXISTS (          -- User-linked profiles where user role is talent
        SELECT 1 FROM profiles p 
        WHERE p.user_id = tp.user_id 
        AND p.role = 'talent'::app_role
      )
    )
  ORDER BY tp.sort_rank ASC;
$function$