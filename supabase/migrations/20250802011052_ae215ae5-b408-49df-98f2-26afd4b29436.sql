-- Create admin profile and role directly without inserting into auth.users
-- The auth.users table will be handled through Supabase Auth
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if we already have an admin user
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'admin@funkoflash.com' 
    LIMIT 1;
    
    -- If no admin exists, create a placeholder profile that will be updated when the user signs up
    IF admin_user_id IS NULL THEN
        -- We can't directly insert into auth.users, so we'll create the profile structure
        -- The actual auth user will need to be created through the Supabase dashboard
        INSERT INTO public.profiles (
            id,
            user_id,
            email,
            first_name,
            last_name,
            role
        ) VALUES (
            gen_random_uuid(),
            gen_random_uuid(), -- This will be updated when the actual user is created
            'admin@funkoflash.com',
            'Admin',
            'User',
            'admin'::app_role
        );
    END IF;
END $$;