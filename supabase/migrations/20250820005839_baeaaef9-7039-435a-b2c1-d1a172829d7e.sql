-- First transaction: Add the 'business' role to the enum
-- Check if 'business' already exists in the app_role enum before adding it
DO $$
BEGIN
    -- Check if 'business' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'business' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        -- Add 'business' to the existing app_role enum
        ALTER TYPE public.app_role ADD VALUE 'business';
    END IF;
END$$;