-- Create an enhanced user deletion function that also handles file cleanup
CREATE OR REPLACE FUNCTION delete_user_and_files_completely(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_exists BOOLEAN;
  file_record RECORD;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = target_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Delete user files from all storage buckets
  FOR file_record IN 
    SELECT bucket_id, name 
    FROM storage.objects 
    WHERE owner = target_user_id OR name LIKE '%' || target_user_id::text || '%'
  LOOP
    DELETE FROM storage.objects 
    WHERE bucket_id = file_record.bucket_id AND name = file_record.name;
  END LOOP;
  
  -- Manual cleanup of user data (in dependency order)
  DELETE FROM public.message_reactions WHERE user_id = target_user_id;
  DELETE FROM public.user_activity_logs WHERE user_id = target_user_id OR admin_user_id = target_user_id;
  DELETE FROM public.user_login_history WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.notification_preferences WHERE user_id = target_user_id;
  DELETE FROM public.talent_profiles WHERE user_id = target_user_id;
  
  -- Delete messages where user is sender or recipient
  DELETE FROM public.messages WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  
  -- Delete from profiles last
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$;