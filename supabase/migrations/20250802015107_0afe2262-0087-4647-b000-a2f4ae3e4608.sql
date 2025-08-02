-- Add new columns to profiles table for enhanced functionality
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'invisible')),
ADD COLUMN IF NOT EXISTS name_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Set replica identity to full for realtime updates
ALTER TABLE public.profiles REPLICA IDENTITY FULL;