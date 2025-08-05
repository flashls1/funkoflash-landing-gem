-- Add proper foreign key constraints with CASCADE DELETE for user cleanup
-- First, let's add the foreign key constraints where they're missing

-- Profiles table (should already have this)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User activity logs
ALTER TABLE public.user_activity_logs 
DROP CONSTRAINT IF EXISTS user_activity_logs_user_id_fkey;

ALTER TABLE public.user_activity_logs 
ADD CONSTRAINT user_activity_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User login history  
ALTER TABLE public.user_login_history 
DROP CONSTRAINT IF EXISTS user_login_history_user_id_fkey;

ALTER TABLE public.user_login_history 
ADD CONSTRAINT user_login_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User roles
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notification preferences
ALTER TABLE public.notification_preferences 
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

ALTER TABLE public.notification_preferences 
ADD CONSTRAINT notification_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Message reactions  
ALTER TABLE public.message_reactions 
DROP CONSTRAINT IF EXISTS message_reactions_user_id_fkey;

ALTER TABLE public.message_reactions 
ADD CONSTRAINT message_reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Talent profiles
ALTER TABLE public.talent_profiles 
DROP CONSTRAINT IF EXISTS talent_profiles_user_id_fkey;

ALTER TABLE public.talent_profiles 
ADD CONSTRAINT talent_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;