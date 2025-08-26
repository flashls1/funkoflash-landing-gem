-- Fix the calendar event status values - 'confirmed' is not a valid status
UPDATE calendar_event SET status = 'booked' WHERE status = 'confirmed';

-- Now insert the correct test events with valid status values
INSERT INTO calendar_event (
  event_title, 
  start_date, 
  end_date, 
  all_day, 
  status, 
  talent_id,
  venue_name,
  location_city,
  location_state
) VALUES 
-- Unassigned events (visible to all roles)
('Comic Convention', '2025-08-30', '2025-09-01', true, 'available', NULL, 'Convention Center', 'Dallas', 'TX'),
('Voice Acting Workshop', '2025-09-15', '2025-09-15', true, 'tentative', NULL, 'Recording Studio', 'Los Angeles', 'CA'),
('Fan Meet & Greet', '2025-09-22', '2025-09-22', true, 'hold', NULL, 'Community Center', 'Phoenix', 'AZ'),

-- Assigned to Vic Mignogna (talent_id from our query)
('Anime Dubbing Session', '2025-09-05', '2025-09-05', false, 'booked', 'ee029947-c389-4bb3-8ac9-0964ae9a9e4c', 'Funimation Studios', 'Dallas', 'TX'),
('Convention Panel', '2025-09-12', '2025-09-12', true, 'booked', 'ee029947-c389-4bb3-8ac9-0964ae9a9e4c', 'Hilton Hotel', 'Austin', 'TX'),
('Character Recording', '2025-10-03', '2025-10-03', false, 'tentative', 'ee029947-c389-4bb3-8ac9-0964ae9a9e4c', 'Home Studio', 'Dallas', 'TX');