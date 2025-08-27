-- Create sample logistics data for the ANIME FRESNO event for Mario Castañeda

-- First get the event and talent IDs
DO $$
DECLARE
    anime_event_id uuid;
    mario_talent_id uuid;
BEGIN
    -- Get the ANIME FRESNO event ID
    SELECT id INTO anime_event_id FROM business_events WHERE title ILIKE '%ANIME FRESNO%' LIMIT 1;
    
    -- Get Mario Castañeda's talent profile ID
    SELECT id INTO mario_talent_id FROM talent_profiles WHERE name ILIKE '%Mario Castañeda%' LIMIT 1;
    
    IF anime_event_id IS NOT NULL AND mario_talent_id IS NOT NULL THEN
        -- Insert event contact information
        INSERT INTO business_event_contact (event_id, contact_name, phone_number, created_at, updated_at)
        VALUES (anime_event_id, 'Sarah Johnson', '+1-559-555-0123', now(), now())
        ON CONFLICT (event_id) DO UPDATE SET
            contact_name = EXCLUDED.contact_name,
            phone_number = EXCLUDED.phone_number,
            updated_at = now();
        
        -- Insert travel details for Mario
        INSERT INTO business_event_travel (
            event_id, talent_id, airline_name, confirmation_codes, status,
            arrival_datetime, departure_datetime, notes, created_at, updated_at
        )
        VALUES (
            anime_event_id, mario_talent_id, 'Southwest Airlines', 'SW1234', 'Booked',
            '2024-10-15 14:30:00-07:00', '2024-10-20 18:45:00-07:00',
            'Direct flight from LAX to FAT', now(), now()
        )
        ON CONFLICT (event_id, talent_id) DO UPDATE SET
            airline_name = EXCLUDED.airline_name,
            confirmation_codes = EXCLUDED.confirmation_codes,
            status = EXCLUDED.status,
            arrival_datetime = EXCLUDED.arrival_datetime,
            departure_datetime = EXCLUDED.departure_datetime,
            notes = EXCLUDED.notes,
            updated_at = now();
        
        -- Insert hotel details for Mario
        INSERT INTO business_event_hotel (
            event_id, talent_id, hotel_name, hotel_address, confirmation_number,
            checkin_date, checkout_date, notes, created_at, updated_at
        )
        VALUES (
            anime_event_id, mario_talent_id, 'Hampton Inn & Suites Fresno', 
            '7905 N Fresno St, Fresno, CA 93720', 'HTN789456',
            '2024-10-15', '2024-10-20', 'King suite reserved', now(), now()
        )
        ON CONFLICT (event_id, talent_id) DO UPDATE SET
            hotel_name = EXCLUDED.hotel_name,
            hotel_address = EXCLUDED.hotel_address,
            confirmation_number = EXCLUDED.confirmation_number,
            checkin_date = EXCLUDED.checkin_date,
            checkout_date = EXCLUDED.checkout_date,
            notes = EXCLUDED.notes,
            updated_at = now();
        
        -- Insert ground transport details for Mario
        INSERT INTO business_event_transport (
            event_id, talent_id, provider_type, confirmation_code,
            pickup_location, dropoff_location, pickup_datetime, dropoff_datetime,
            notes, created_at, updated_at
        )
        VALUES (
            anime_event_id, mario_talent_id, 'Uber', 'UBR-2024-1015',
            'Fresno Yosemite International Airport', 'Hampton Inn & Suites Fresno',
            '2024-10-15 15:00:00-07:00', '2024-10-15 15:30:00-07:00',
            'Airport pickup arranged', now(), now()
        )
        ON CONFLICT (event_id, talent_id) DO UPDATE SET
            provider_type = EXCLUDED.provider_type,
            confirmation_code = EXCLUDED.confirmation_code,
            pickup_location = EXCLUDED.pickup_location,
            dropoff_location = EXCLUDED.dropoff_location,
            pickup_datetime = EXCLUDED.pickup_datetime,
            dropoff_datetime = EXCLUDED.dropoff_datetime,
            notes = EXCLUDED.notes,
            updated_at = now();
        
        RAISE NOTICE 'Sample logistics data created for ANIME FRESNO event and Mario Castañeda';
    ELSE
        RAISE NOTICE 'Could not find ANIME FRESNO event or Mario Castañeda talent profile';
    END IF;
END $$;