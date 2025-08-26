-- Fix RLS policy infinite recursion by creating security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role::app_role
  )
$$;

-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users with calendar:edit can manage all events" ON calendar_event;
DROP POLICY IF EXISTS "Users with calendar:edit_own can manage their own events" ON calendar_event;
DROP POLICY IF EXISTS "Users with calendar:view can view events" ON calendar_event;

-- Create simplified, non-recursive RLS policies
CREATE POLICY "Admins can manage all calendar events"
ON calendar_event
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage all calendar events"
ON calendar_event
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'staff'))
WITH CHECK (has_role(auth.uid(), 'staff'));

CREATE POLICY "Talent can view all events and manage their own"
ON calendar_event
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'talent') AND (
    talent_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM talent_profiles tp 
      WHERE tp.id = calendar_event.talent_id 
      AND tp.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'talent') AND (
    talent_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM talent_profiles tp 
      WHERE tp.id = calendar_event.talent_id 
      AND tp.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Business can view unassigned events"
ON calendar_event
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'business') AND talent_id IS NULL);

-- Fix business role permissions (remove edit_own, keep only view)
DELETE FROM role_permissions WHERE role_key = 'business' AND permission_scope = 'calendar:edit_own';

-- Create some test events for current date (August 2025)
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
('Convention Panel', '2025-09-12', '2025-09-12', true, 'confirmed', 'ee029947-c389-4bb3-8ac9-0964ae9a9e4c', 'Hilton Hotel', 'Austin', 'TX'),
('Character Recording', '2025-10-03', '2025-10-03', false, 'tentative', 'ee029947-c389-4bb3-8ac9-0964ae9a9e4c', 'Home Studio', 'Dallas', 'TX');