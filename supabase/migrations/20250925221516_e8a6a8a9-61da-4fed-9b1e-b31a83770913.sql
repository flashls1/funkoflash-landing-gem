-- Add foreign keys only if they don't exist (ignore errors if they already exist)
DO $$
BEGIN
  -- Add foreign key for business_event_travel -> business_events
  BEGIN
    ALTER TABLE business_event_travel 
    ADD CONSTRAINT fk_business_event_travel_event 
    FOREIGN KEY (event_id) REFERENCES business_events(id);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if constraint already exists
  END;

  -- Add foreign key for business_event_travel -> talent_profiles  
  BEGIN
    ALTER TABLE business_event_travel 
    ADD CONSTRAINT fk_business_event_travel_talent 
    FOREIGN KEY (talent_id) REFERENCES talent_profiles(id);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if constraint already exists
  END;

  -- Add foreign key for business_event_hotel -> business_events
  BEGIN
    ALTER TABLE business_event_hotel 
    ADD CONSTRAINT fk_business_event_hotel_event 
    FOREIGN KEY (event_id) REFERENCES business_events(id);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if constraint already exists
  END;

  -- Add foreign key for business_event_hotel -> talent_profiles
  BEGIN
    ALTER TABLE business_event_hotel 
    ADD CONSTRAINT fk_business_event_hotel_talent 
    FOREIGN KEY (talent_id) REFERENCES talent_profiles(id);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if constraint already exists
  END;

  -- Add foreign key for business_event_transport -> business_events
  BEGIN
    ALTER TABLE business_event_transport 
    ADD CONSTRAINT fk_business_event_transport_event 
    FOREIGN KEY (event_id) REFERENCES business_events(id);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if constraint already exists
  END;

  -- Add foreign key for business_event_transport -> talent_profiles
  BEGIN
    ALTER TABLE business_event_transport 
    ADD CONSTRAINT fk_business_event_transport_talent 
    FOREIGN KEY (talent_id) REFERENCES talent_profiles(id);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if constraint already exists
  END;
END $$;