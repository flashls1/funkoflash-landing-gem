-- Add new RBAC permissions for calendar management
INSERT INTO public.permissions (scope, description) 
VALUES 
  ('calendar:manage', 'Settings/import modes (replace year), destructive operations')
ON CONFLICT (scope) DO NOTHING;

-- Insert role permissions for calendar management
INSERT INTO public.role_permissions (role_key, permission_scope) 
VALUES 
  ('admin', 'calendar:manage')
ON CONFLICT (role_key, permission_scope) DO NOTHING;

-- Add additional calendar_event fields for enhanced functionality
ALTER TABLE public.calendar_event 
ADD COLUMN IF NOT EXISTS address_line text,
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS notes_internal text,
ADD COLUMN IF NOT EXISTS travel_in date,
ADD COLUMN IF NOT EXISTS travel_out date,
ADD COLUMN IF NOT EXISTS source_row_id text;

-- Drop existing policies if they exist (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Users with calendar:edit can manage all events" ON public.calendar_event;
DROP POLICY IF EXISTS "Users with calendar:edit_own can manage their own events" ON public.calendar_event;

-- Add RLS policies for enhanced calendar editing
CREATE POLICY "Users with calendar:edit can manage all events" 
ON public.calendar_event 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM role_permissions rp 
    JOIN profiles p ON p.role = rp.role_key 
    WHERE p.user_id = auth.uid() AND rp.permission_scope = 'calendar:edit'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM role_permissions rp 
    JOIN profiles p ON p.role = rp.role_key 
    WHERE p.user_id = auth.uid() AND rp.permission_scope = 'calendar:edit'
  )
);

CREATE POLICY "Users with calendar:edit_own can manage their own events" 
ON public.calendar_event 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM role_permissions rp 
    JOIN profiles p ON p.role = rp.role_key 
    WHERE p.user_id = auth.uid() AND rp.permission_scope = 'calendar:edit_own'
  ) AND 
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = calendar_event.talent_id AND tp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM role_permissions rp 
    JOIN profiles p ON p.role = rp.role_key 
    WHERE p.user_id = auth.uid() AND rp.permission_scope = 'calendar:edit_own'
  ) AND 
  EXISTS (
    SELECT 1 FROM talent_profiles tp 
    WHERE tp.id = calendar_event.talent_id AND tp.user_id = auth.uid()
  )
);