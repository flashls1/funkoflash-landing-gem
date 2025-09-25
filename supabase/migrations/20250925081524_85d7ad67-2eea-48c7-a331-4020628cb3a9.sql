-- Add preferred_language field to profiles table for language persistence
ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'es'));

-- Add seed event: Collectors Collision Convention
INSERT INTO public.business_events (
  title,
  start_ts,
  end_ts,
  city,
  state,
  country,
  venue,
  status,
  daily_schedule,
  created_by,
  address_line
) VALUES (
  'Collectors Collision Convention',
  '2025-11-29 08:00:00-06:00'::timestamptz,
  '2025-11-30 20:00:00-06:00'::timestamptz,
  'Dallas',
  'TX',
  'USA',
  'Dallas Convention Center',
  'confirmed',
  '[
    {
      "day": 1,
      "date": "2025-11-29",
      "start_time": "08:00:00",
      "end_time": "20:00:00",
      "schedule": [
        {"time": "08:00", "title": "Setup & Prep", "notes": "Event setup and talent prep time"},
        {"time": "09:00", "title": "Doors Open", "notes": "Convention opens to public"},
        {"time": "10:00", "title": "Meet & Greet Sessions", "notes": "Talent meet and greet with fans"},
        {"time": "12:00", "title": "Lunch Break", "notes": "Break for lunch"},
        {"time": "13:00", "title": "Autograph Sessions", "notes": "Scheduled autograph signing"},
        {"time": "15:00", "title": "Photo Opportunities", "notes": "Professional photo sessions"},
        {"time": "17:00", "title": "Panel Discussion", "notes": "Talent panel and Q&A"},
        {"time": "19:00", "title": "Wrap Up", "notes": "End of day activities"},
        {"time": "20:00", "title": "Event Close", "notes": "Convention closes for the day"}
      ]
    },
    {
      "day": 2,
      "date": "2025-11-30",
      "start_time": "08:00:00",
      "end_time": "20:00:00",
      "schedule": [
        {"time": "08:00", "title": "Setup & Prep", "notes": "Event setup and talent prep time"},
        {"time": "09:00", "title": "Doors Open", "notes": "Convention opens to public"},
        {"time": "10:00", "title": "Meet & Greet Sessions", "notes": "Talent meet and greet with fans"},
        {"time": "12:00", "title": "Lunch Break", "notes": "Break for lunch"},
        {"time": "13:00", "title": "Autograph Sessions", "notes": "Scheduled autograph signing"},
        {"time": "15:00", "title": "Photo Opportunities", "notes": "Professional photo sessions"},
        {"time": "17:00", "title": "Final Panel", "notes": "Closing panel and Q&A"},
        {"time": "19:00", "title": "Convention Wrap", "notes": "Final day wrap up"},
        {"time": "20:00", "title": "Event Close", "notes": "Convention ends"}
      ]
    }
  ]'::jsonb,
  (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1),
  '650 S Griffin St, Dallas, TX 75202'
);