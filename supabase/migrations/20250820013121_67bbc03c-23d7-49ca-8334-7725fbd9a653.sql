-- Add calendar:edit permissions for admin/staff and calendar:edit_own for talent/business
INSERT INTO public.permissions (scope, description) VALUES
  ('calendar:edit', 'Create, edit, and delete calendar events for any talent'),
  ('calendar:edit_own', 'Create, edit, and delete own calendar events')
ON CONFLICT (scope) DO NOTHING;

-- Grant calendar:edit to admin and staff
INSERT INTO public.role_permissions (role_key, permission_scope) VALUES
  ('admin', 'calendar:edit'),
  ('staff', 'calendar:edit')
ON CONFLICT (role_key, permission_scope) DO NOTHING;

-- Grant calendar:edit_own to talent and business  
INSERT INTO public.role_permissions (role_key, permission_scope) VALUES
  ('talent', 'calendar:edit_own'),
  ('business', 'calendar:edit_own')
ON CONFLICT (role_key, permission_scope) DO NOTHING;

-- Update status CHECK constraint to include 'not_available'
-- First, get the current constraint name and drop it
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Find the CHECK constraint on status column
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid
    WHERE rel.relname = 'calendar_event' 
    AND con.contype = 'c'
    AND att.attname = 'status'
    AND att.attnum = ANY(con.conkey);
    
    -- Drop the existing constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.calendar_event DROP CONSTRAINT %I', constraint_name);
    END IF;
    
    -- Add new constraint with not_available included
    ALTER TABLE public.calendar_event 
    ADD CONSTRAINT calendar_event_status_check 
    CHECK (status IN ('booked', 'hold', 'available', 'tentative', 'cancelled', 'not_available'));
END $$;