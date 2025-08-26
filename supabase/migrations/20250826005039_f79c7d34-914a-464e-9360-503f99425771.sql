-- Create a test event for verification
INSERT INTO calendar_event (
  event_title,
  start_date,
  end_date,
  status,
  talent_id,
  all_day
) VALUES (
  'Test Event for Vic Mignogna',
  '2025-01-15',
  '2025-01-15', 
  'available',
  NULL,  -- Unassigned event (should be visible to all)
  true
);

-- Add more test events for the current month
INSERT INTO calendar_event (
  event_title,
  start_date,
  end_date,
  status,
  talent_id,
  all_day
) VALUES 
(
  'Convention Appearance',
  '2025-01-20',
  '2025-01-22',
  'booked',
  NULL,
  true
),
(
  'Voice Recording Session',
  '2025-01-25',
  '2025-01-25',
  'tentative',
  NULL,
  false
);