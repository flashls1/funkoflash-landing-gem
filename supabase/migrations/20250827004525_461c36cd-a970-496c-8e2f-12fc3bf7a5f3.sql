-- First, clean up existing orphaned business accounts
DELETE FROM business_event_account 
WHERE business_account_id IN (
  SELECT ba.id
  FROM business_account ba
  LEFT JOIN profiles p ON p.email = ba.contact_email
  WHERE p.id IS NULL
    AND ba.contact_email IS NOT NULL
    AND ba.contact_email != ''
);

DELETE FROM business_account 
WHERE id IN (
  SELECT ba.id
  FROM business_account ba
  LEFT JOIN profiles p ON p.email = ba.contact_email
  WHERE p.id IS NULL
    AND ba.contact_email IS NOT NULL
    AND ba.contact_email != ''
);

-- Enhanced user deletion function with comprehensive business account cleanup
CREATE OR REPLACE FUNCTION public.delete_user_and_files_completely_enhanced(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_exists BOOLEAN;
  user_email TEXT;
  business_account_ids UUID[];
  deleted_counts JSONB := '{}'::jsonb;
  row_count_var INTEGER;
BEGIN
  -- Check if user exists and get email
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = target_user_id), 
         email 
  INTO user_exists, user_email
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF NOT user_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Log the deletion attempt
  PERFORM public.log_security_event(
    'user_deletion_started',
    'profiles',
    target_user_id,
    NULL,
    jsonb_build_object('target_email', user_email, 'deleted_by', auth.uid())
  );
  
  -- Get business accounts associated with this user's email or business name
  SELECT array_agg(ba.id) INTO business_account_ids
  FROM public.business_account ba
  JOIN public.profiles p ON (ba.contact_email = p.email OR ba.name = p.business_name)
  WHERE p.user_id = target_user_id;
  
  -- PHASE 1: Clean up business event related data
  IF business_account_ids IS NOT NULL THEN
    -- Clean up business event transport records
    DELETE FROM public.business_event_transport 
    WHERE event_id IN (
      SELECT bea.event_id 
      FROM public.business_event_account bea 
      WHERE bea.business_account_id = ANY(business_account_ids)
    );
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{business_event_transport}', to_jsonb(row_count_var));
    
    -- Clean up business event hotel records
    DELETE FROM public.business_event_hotel 
    WHERE event_id IN (
      SELECT bea.event_id 
      FROM public.business_event_account bea 
      WHERE bea.business_account_id = ANY(business_account_ids)
    );
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{business_event_hotel}', to_jsonb(row_count_var));
    
    -- Clean up business event contact records
    DELETE FROM public.business_event_contact 
    WHERE event_id IN (
      SELECT bea.event_id 
      FROM public.business_event_account bea 
      WHERE bea.business_account_id = ANY(business_account_ids)
    );
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{business_event_contact}', to_jsonb(row_count_var));
    
    -- Clean up business talent access records
    DELETE FROM public.business_talent_access 
    WHERE business_event_id IN (
      SELECT bea.event_id 
      FROM public.business_event_account bea 
      WHERE bea.business_account_id = ANY(business_account_ids)
    );
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{business_talent_access}', to_jsonb(row_count_var));
    
    -- Clean up business event assignments
    DELETE FROM public.business_event_account 
    WHERE business_account_id = ANY(business_account_ids);
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{business_event_account}', to_jsonb(row_count_var));
    
    -- Clean up business accounts
    DELETE FROM public.business_account 
    WHERE id = ANY(business_account_ids);
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{business_account}', to_jsonb(row_count_var));
  END IF;
  
  -- PHASE 2: Clean up calendar events created by this user (business events)
  DELETE FROM public.calendar_event 
  WHERE created_by = target_user_id 
     OR event_title IN (
       SELECT be.title 
       FROM public.business_events be 
       WHERE be.created_by = target_user_id
     );
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{calendar_event}', to_jsonb(row_count_var));
  
  -- PHASE 3: Clean up business events created by this user
  DELETE FROM public.business_events 
  WHERE created_by = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{business_events}', to_jsonb(row_count_var));
  
  -- PHASE 4: Delete user files from all storage buckets
  DELETE FROM storage.objects 
  WHERE owner = target_user_id OR name LIKE '%' || target_user_id::text || '%';
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{storage_objects}', to_jsonb(row_count_var));
  
  -- PHASE 5: Manual cleanup of user data (in dependency order)
  DELETE FROM public.message_reactions WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{message_reactions}', to_jsonb(row_count_var));
  
  DELETE FROM public.user_activity_logs WHERE user_id = target_user_id OR admin_user_id = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_activity_logs}', to_jsonb(row_count_var));
  
  DELETE FROM public.user_login_history WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_login_history}', to_jsonb(row_count_var));
  
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_roles}', to_jsonb(row_count_var));
  
  DELETE FROM public.notification_preferences WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{notification_preferences}', to_jsonb(row_count_var));
  
  DELETE FROM public.talent_profiles WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{talent_profiles}', to_jsonb(row_count_var));
  
  -- Delete messages where user is sender or recipient
  DELETE FROM public.messages WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{messages}', to_jsonb(row_count_var));
  
  -- PHASE 6: Delete from profiles last
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count_var = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{profiles}', to_jsonb(row_count_var));
  
  -- Log the successful deletion
  PERFORM public.log_security_event(
    'user_deletion_completed',
    'profiles',
    target_user_id,
    NULL,
    jsonb_build_object(
      'target_email', user_email, 
      'deleted_by', auth.uid(),
      'deletion_summary', deleted_counts
    )
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'user_email', user_email,
    'deletion_summary', deleted_counts
  );
END;
$function$;

-- Function to detect and clean up orphaned business accounts
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_business_accounts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cleanup_summary JSONB;
  orphaned_count INTEGER;
  assignments_count INTEGER;
BEGIN
  -- Only allow admin/staff to run this
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to cleanup orphaned business accounts';
  END IF;
  
  -- Clean up orphaned business event assignments first
  DELETE FROM business_event_account 
  WHERE business_account_id IN (
    SELECT ba.id
    FROM business_account ba
    LEFT JOIN profiles p ON p.email = ba.contact_email
    WHERE p.id IS NULL
      AND ba.contact_email IS NOT NULL
      AND ba.contact_email != ''
  );
  GET DIAGNOSTICS assignments_count = ROW_COUNT;
  
  -- Get count of orphaned business accounts
  SELECT COUNT(*) INTO orphaned_count
  FROM business_account ba
  LEFT JOIN profiles p ON p.email = ba.contact_email
  WHERE p.id IS NULL
    AND ba.contact_email IS NOT NULL
    AND ba.contact_email != '';
  
  -- Clean up orphaned business accounts
  DELETE FROM business_account 
  WHERE id IN (
    SELECT ba.id
    FROM business_account ba
    LEFT JOIN profiles p ON p.email = ba.contact_email
    WHERE p.id IS NULL
      AND ba.contact_email IS NOT NULL
      AND ba.contact_email != ''
  );
  
  cleanup_summary := jsonb_build_object(
    'orphaned_accounts_deleted', orphaned_count,
    'orphaned_assignments_deleted', assignments_count,
    'cleanup_timestamp', now(),
    'cleaned_by', auth.uid()
  );
  
  -- Log the cleanup
  PERFORM log_security_event(
    'orphaned_business_accounts_cleanup',
    'business_account',
    NULL,
    NULL,
    cleanup_summary
  );
  
  RETURN cleanup_summary;
END;
$function$;

-- Replace the old deletion function to use the enhanced version
CREATE OR REPLACE FUNCTION public.delete_user_and_files_completely(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result JSONB;
BEGIN
  result := delete_user_and_files_completely_enhanced(target_user_id);
  RETURN (result->>'success')::boolean;
END;
$function$;