-- COMPREHENSIVE FIX: Create calendar events for existing business events (CORRECTED)

DO $$
DECLARE
  admin_user_id UUID;
  business_event_record RECORD;
BEGIN
  -- Get an admin user ID
  SELECT user_id INTO admin_user_id 
  FROM profiles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found to create calendar events';
  END IF;
  
  -- Create calendar events for business events that don't have them
  FOR business_event_record IN 
    SELECT be.id, be.title, be.start_ts, be.end_ts, be.city, be.state, be.venue
    FROM business_events be
    WHERE NOT EXISTS (
      SELECT 1 FROM calendar_event ce 
      WHERE ce.source_row_id = be.id::text
    )
  LOOP
    -- Create calendar event for this business event
    INSERT INTO calendar_event (
      event_title,
      start_date,
      end_date,
      start_time,
      end_time,
      all_day,
      status,
      venue_name,
      location_city,
      location_state,
      location_country,
      timezone,
      source_row_id,
      created_by,
      notes_internal
    ) VALUES (
      business_event_record.title,
      business_event_record.start_ts::date,
      business_event_record.end_ts::date,
      business_event_record.start_ts::time,
      business_event_record.end_ts::time,
      false,
      'booked',  -- Use valid status
      business_event_record.venue,
      business_event_record.city,
      business_event_record.state,
      'USA',
      'America/Chicago',
      business_event_record.id::text,
      admin_user_id,
      'Auto-created from business event: ' || business_event_record.title
    );
    
    RAISE NOTICE 'Created calendar event for business event: %', business_event_record.title;
  END LOOP;
END
$$;