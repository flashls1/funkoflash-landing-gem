-- Create a comprehensive user deletion function
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = target_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Manual cleanup in case cascade doesn't work
  -- Delete from public tables first (in dependency order)
  DELETE FROM public.message_reactions WHERE user_id = target_user_id;
  DELETE FROM public.user_activity_logs WHERE user_id = target_user_id;
  DELETE FROM public.user_login_history WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.notification_preferences WHERE user_id = target_user_id;
  DELETE FROM public.talent_profiles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$;